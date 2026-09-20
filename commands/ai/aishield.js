import axios from 'axios'

/*
============================================================
                    DARK-EYE AI SHIELD
============================================================

Commands:

.aishield on
.aishield off
.aishield status

When enabled:

• Scans URLs in incoming messages
• Checks suspicious links
• Detects common scam patterns
• Uses Google Safe Browsing when configured
• Uses URLhaus when configured
• Warns the chat about detected threats
• Never opens suspicious URLs
• Never executes downloaded files

IMPORTANT:

A "clean" result does NOT guarantee that a URL
is completely safe. Threat databases can have
false negatives and newly created malicious URLs.
============================================================
*/

const urlRegex =
    /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi

/*
============================================================
CHAT SETTINGS
============================================================
*/

function getShieldSettings(
    BOT_SETTINGS
) {

    if (!BOT_SETTINGS.aishield) {
        BOT_SETTINGS.aishield = {}
    }

    return BOT_SETTINGS.aishield
}

function isShieldEnabled(
    BOT_SETTINGS,
    chatId
) {

    const settings =
        getShieldSettings(BOT_SETTINGS)

    return settings[chatId] === true
}

/*
============================================================
EXTRACT URLS
============================================================
*/

function extractUrls(text = '') {

    const matches =
        text.match(urlRegex) || []

    return [
        ...new Set(
            matches.map(url => {

                let clean =
                    url.trim()

                /*
                Remove punctuation that commonly
                comes after a URL in normal text.
                */

                clean =
                    clean.replace(
                        /[),.!?;:'"]+$/g,
                        ''
                    )

                if (
                    clean.startsWith(
                        'www.'
                    )
                ) {
                    clean =
                        `https://${clean}`
                }

                return clean
            })
        )
    ]
}

/*
============================================================
NORMALIZE URL
============================================================
*/

function normalizeUrl(url) {

    try {

        const parsed =
            new URL(url)

        return parsed.href

    } catch {

        return null
    }
}

/*
============================================================
SUSPICIOUS TEXT DETECTION
============================================================

This is deliberately conservative.

It provides a signal for obvious scam language,
not a final verdict.
============================================================
*/

function detectScamLanguage(
    text = ''
) {

    const normalized =
        text
            .toLowerCase()
            .replace(/\s+/g, ' ')

    const patterns = [

        {
            pattern:
                /send\s+(?:me\s+)?(?:your\s+)?otp\b/i,

            reason:
                'Requests an OTP/security code'
        },

        {
            pattern:
                /\bverification\s+code\b.*\bsend\b/i,

            reason:
                'Requests a verification code'
        },

        {
            pattern:
                /\b(?:send|give)\s+(?:me\s+)?your\s+password\b/i,

            reason:
                'Requests a password'
        },

        {
            pattern:
                /\b(?:send|give)\s+(?:me\s+)?your\s+pin\b/i,

            reason:
                'Requests a PIN'
        },

        {
            pattern:
                /\b(?:you\s+)?(?:won|winner|congratulations)\b.*\b(?:prize|money|cash)\b/i,

            reason:
                'Possible prize scam'
        },

        {
            pattern:
                /\bclaim\s+(?:your\s+)?(?:prize|reward|money)\b/i,

            reason:
                'Possible fake reward'
        },

        {
            pattern:
                /\bfree\s+(?:airtime|data|money|cash)\b/i,

            reason:
                'Possible fake free-offer scam'
        },

        {
            pattern:
                /\b(?:urgent|immediately|act\s+now)\b.*\b(?:account|payment|verify)\b/i,

            reason:
                'Urgency combined with account/payment request'
        },

        {
            pattern:
                /\b(?:account|whatsapp)\b.*\b(?:suspended|banned|blocked)\b.*\b(?:verify|click|link)\b/i,

            reason:
                'Possible account-verification scam'
        },

        {
            pattern:
                /\b(?:investment|crypto)\b.*\b(?:guaranteed|profit|returns)\b/i,

            reason:
                'Possible investment scam'
        }
    ]

    for (
        const item of patterns
    ) {

        if (
            item.pattern.test(
                normalized
            )
        ) {

            return {
                suspicious: true,
                reason: item.reason
            }
        }
    }

    return {
        suspicious: false,
        reason: null
    }
}

/*
============================================================
GOOGLE SAFE BROWSING
============================================================

Google Safe Browsing checks URLs against Google's
unsafe-resource lists.

The API key should be stored as:

GOOGLE_SAFE_BROWSING_API_KEY=
============================================================
*/

async function checkGoogleSafeBrowsing(
    url
) {

    const apiKey =
        process.env.GOOGLE_SAFE_BROWSING_API_KEY

    if (!apiKey) {

        return {
            available: false,
            malicious: false,
            source: 'Google Safe Browsing'
        }
    }

    const endpoint =
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`

    const response =
        await axios.post(
            endpoint,
            {
                client: {
                    clientId:
                        'skyper-md',

                    clientVersion:
                        '2.0.0'
                },

                threatInfo: {

                    threatTypes: [
                        'MALWARE',
                        'SOCIAL_ENGINEERING',
                        'UNWANTED_SOFTWARE',
                        'POTENTIALLY_HARMFUL_APPLICATION'
                    ],

                    platformTypes: [
                        'ANY_PLATFORM'
                    ],

                    threatEntryTypes: [
                        'URL'
                    ],

                    threatEntries: [
                        {
                            url
                        }
                    ]
                }
            },
            {
                timeout: 15000
            }
        )

    const matches =
        response.data?.matches || []

    return {
        available: true,

        malicious:
            matches.length > 0,

        matches
    }
}

/*
============================================================
URLHAUS
============================================================

URLhaus provides malware URL intelligence.

Some URLhaus API functions require an Auth-Key.
Therefore the integration below only runs when:

URLHAUS_AUTH_KEY=

is configured.

We never download or execute the payload.
============================================================
*/

async function checkUrlhaus(
    url
) {

    const authKey =
        process.env.URLHAUS_AUTH_KEY

    if (!authKey) {

        return {
            available: false,
            malicious: false
        }
    }

    const response =
        await axios.post(
            'https://urlhaus-api.abuse.ch/v1/url/',
            new URLSearchParams({
                url
            }),
            {
                headers: {
                    'Auth-Key':
                        authKey,

                    'Content-Type':
                        'application/x-www-form-urlencoded'
                },

                timeout: 15000
            }
        )

    const data =
        response.data || {}

    return {
        available: true,

        malicious:
            data.query_status ===
            'listed',

        status:
            data.query_status,

        threat:
            data.threat,

        tags:
            data.tags || []
    }
}

/*
============================================================
SCAN SINGLE URL
============================================================
*/

async function scanUrl(
    url
) {

    const normalized =
        normalizeUrl(url)

    if (!normalized) {

        return {
            url,
            status: 'invalid',
            malicious: false
        }
    }

    /*
    Never visit the URL.
    Only submit the URL string to
    reputation services.
    */

    const result = {

        url: normalized,

        malicious: false,

        sources: [],

        reasons: []
    }

    /*
    --------------------------------------------------------
    GOOGLE
    --------------------------------------------------------
    */

    try {

        const google =
            await checkGoogleSafeBrowsing(
                normalized
            )

        if (google.available) {

            result.sources.push(
                'Google Safe Browsing'
            )

            if (google.malicious) {

                result.malicious = true

                result.reasons.push(
                    'Google Safe Browsing reported a threat'
                )
            }
        }

    } catch (error) {

        console.error(
            '[AI SHIELD] Google check failed:',
            error.message
        )
    }

    /*
    --------------------------------------------------------
    URLHAUS
    --------------------------------------------------------
    */

    try {

        const urlhaus =
            await checkUrlhaus(
                normalized
            )

        if (urlhaus.available) {

            result.sources.push(
                'URLhaus'
            )

            if (urlhaus.malicious) {

                result.malicious = true

                result.reasons.push(
                    `URLhaus listed this URL${
                        urlhaus.threat
                            ? ` as ${urlhaus.threat}`
                            : ''
                    }`
                )
            }
        }

    } catch (error) {

        console.error(
            '[AI SHIELD] URLhaus check failed:',
            error.message
        )
    }

    /*
    --------------------------------------------------------
    FINAL STATUS
    --------------------------------------------------------
    */

    if (result.malicious) {

        result.status =
            'MALICIOUS'

    } else if (
        result.sources.length
    ) {

        result.status =
            'NO_KNOWN_THREAT'

    } else {

        result.status =
            'NOT_CHECKED'
    }

    return result
}

/*
============================================================
SCAN MESSAGE
============================================================
*/

export async function scanMessage(
    text
) {

    const urls =
        extractUrls(text)

    const scamLanguage =
        detectScamLanguage(text)

    const results = []

    /*
    Scan every URL individually.
    */

    for (
        const url of urls
    ) {

        try {

            const result =
                await scanUrl(url)

            results.push(result)

        } catch (error) {

            results.push({
                url,
                status: 'ERROR',
                malicious: false,
                error:
                    error.message
            })
        }
    }

    const maliciousUrls =
        results.filter(
            item => item.malicious
        )

    return {

        urls,

        results,

        malicious:
            maliciousUrls.length > 0,

        suspiciousLanguage:
            scamLanguage.suspicious,

        scamReason:
            scamLanguage.reason,

        scanned:
            results.length > 0
    }
}

/*
============================================================
FORMAT WARNING
============================================================
*/

function createWarning(
    scan
) {

    const dangerous =
        scan.results
            .filter(
                result =>
                    result.malicious
            )

    const links =
        dangerous
            .map(
                result =>
                    `│ 🔴 ${result.url}`
            )
            .join('\n')

    const reasons =
        dangerous
            .flatMap(
                result =>
                    result.reasons || []
            )

    const uniqueReasons =
        [
            ...new Set(reasons)
        ]

    return (
`╭───❒ *AI SHIELD ALERT* ❒───╮
│
│ 🚨 *POTENTIAL THREAT DETECTED*
│
${links || '│ 🔴 Suspicious content detected'}
│
│ ⚠️ *Why:*
${uniqueReasons
    .map(
        reason =>
            `│ • ${reason}`
    )
    .join('\n')}
│
│ 🛡️ *Safety advice:*
│ • Do not open the link.
│ • Do not enter passwords.
│ • Never share OTP/PIN codes.
│ • Do not download unknown files.
│
│ ⚠️ Detection systems are not
│ perfect. Treat unexpected
│ links with caution.
│
╰────────────────────────────❒`
    )
}

/*
============================================================
COMMAND
============================================================
*/

const aiShieldCommand = {

    name: 'aishield',

    aliases: [
        'shield',
        'aisafe',
        'safety'
    ],

    category: 'ai',

    async execute({
        from,
        reply,
        args,
        isAdmin,
        isOwner,
        BOT_SETTINGS,
        saveSettings,
        config
    }) {

        const action =
            args?.[0]
                ?.toLowerCase()
                ?.trim()

        const settings =
            getShieldSettings(
                BOT_SETTINGS
            )

        /*
        --------------------------------------------------------
        STATUS
        --------------------------------------------------------
        */

        if (
            !action ||
            action === 'status'
        ) {

            const enabled =
                isShieldEnabled(
                    BOT_SETTINGS,
                    from
                )

            return reply(
`╭───❒ *AI SHIELD* ❒───╮
│
│ 🛡️ Status:
│ ${enabled ? '🟢 ON' : '🔴 OFF'}
│
│ 🔗 URL scanning:
│ ${enabled ? '🟢 ENABLED' : '🔴 DISABLED'}
│
│ 🚨 Scam detection:
│ ${enabled ? '🟢 ENABLED' : '🔴 DISABLED'}
│
│
│ Commands:
│
│ .aishield on
│ .aishield off
│ .aishield status
│
╰──────────────────────❒

${config?.watermark || ''}`
            )
        }

        /*
        --------------------------------------------------------
        PERMISSION
        --------------------------------------------------------
        */

        if (
            !isOwner &&
            !isAdmin
        ) {

            return reply(
`╭───❒ *AI SHIELD* ❒───╮
│
│ ❌ Only the bot owner or
│ group admins can change
│ AI Shield settings.
│
╰──────────────────────❒`
            )
        }

        /*
        --------------------------------------------------------
        ENABLE
        --------------------------------------------------------
        */

        if (
            action === 'on' ||
            action === 'enable'
        ) {

            settings[from] = true

            if (
                typeof saveSettings ===
                'function'
            ) {
                await saveSettings()
            }

            return reply(
`╭───❒ *AI SHIELD* ❒───╮
│
│ 🟢 *AI SHIELD ENABLED*
│
│ DARK-EYE will now inspect
│ incoming messages for:
│
│ 🔗 Suspicious links
│ 🚨 Known malware URLs
│ 🎣 Possible phishing links
│ 💰 Common scam patterns
│ 🔐 OTP/PIN requests
│ ⚠️ Suspicious account warnings
│
│ 🛡️ Suspicious URLs are checked
│ without opening them.
│
╰────────────────────────────❒

${config?.watermark || ''}`
            )
        }

        /*
        --------------------------------------------------------
        DISABLE
        --------------------------------------------------------
        */

        if (
            action === 'off' ||
            action === 'disable'
        ) {

            settings[from] = false

            if (
                typeof saveSettings ===
                'function'
            ) {
                await saveSettings()
            }

            return reply(
`╭───❒ *AI SHIELD* ❒───╮
│
│ 🔴 *AI SHIELD DISABLED*
│
│ Automatic link and scam
│ scanning is now disabled
│ for this chat.
│
│ Enable again with:
│
│ .aishield on
│
╰────────────────────────────❒

${config?.watermark || ''}`
            )
        }

        /*
        --------------------------------------------------------
        INVALID OPTION
        --------------------------------------------------------
        */

        return reply(
`╭───❒ *AI SHIELD* ❒───╮
│
│ ❌ Unknown option.
│
│ Use:
│
│ .aishield on
│ .aishield off
│ .aishield status
│
╰──────────────────────❒`
        )
    }
}

/*
============================================================
AUTOMATIC MESSAGE HANDLER
============================================================

index.js must call:

handleAIShield(context)

for ordinary incoming messages.
============================================================
*/

export async function handleAIShield({

    sock,
    m,
    from,
    body,
    BOT_SETTINGS,
    config

}) {

    /*
    --------------------------------------------------------
    1. SHIELD MUST BE ENABLED
    --------------------------------------------------------
    */

    if (
        !isShieldEnabled(
            BOT_SETTINGS,
            from
        )
    ) {
        return false
    }

    /*
    --------------------------------------------------------
    2. NEVER SCAN BOT'S OWN MESSAGES
    --------------------------------------------------------
    */

    if (
        m?.key?.fromMe
    ) {
        return false
    }

    const text =
        body?.trim() || ''

    if (!text) {
        return false
    }

    /*
    --------------------------------------------------------
    3. QUICK CHECK
    --------------------------------------------------------
    */

    const urls =
        extractUrls(text)

    const scamLanguage =
        detectScamLanguage(text)

    /*
    Don't call external APIs when there
    is absolutely nothing suspicious.
    */

    if (
        urls.length === 0 &&
        !scamLanguage.suspicious
    ) {
        return false
    }

    /*
    --------------------------------------------------------
    4. SCAN
    --------------------------------------------------------
    */

    try {

        const scan =
            await scanMessage(text)

        /*
        ----------------------------------------------------
        5. KNOWN MALICIOUS URL
        ----------------------------------------------------
        */

        if (
            scan.malicious
        ) {

            await sock.sendMessage(
                from,
                {
                    text:
                        createWarning(scan)
                },
                {
                    quoted: m
                }
            )

            return true
        }

        /*
        ----------------------------------------------------
        6. SUSPICIOUS SCAM LANGUAGE
        ----------------------------------------------------
        */

        if (
            scan.suspiciousLanguage
        ) {

            await sock.sendMessage(
                from,
                {
                    text:
`╭───❒ *AI SHIELD* ❒───╮
│
│ ⚠️ *POSSIBLE SCAM*
│
│ ${scan.scamReason}
│
│ 🛡️ Please be careful.
│
│ Never share:
│ • WhatsApp verification codes
│ • OTPs
│ • PINs
│ • Passwords
│ • Recovery codes
│
│ Verify unexpected offers
│ independently before acting.
│
╰──────────────────────❒

${config?.watermark || ''}`
                },
                {
                    quoted: m
                }
            )

            return true
        }

        return false

    } catch (error) {

        /*
        Security feature failure should
        NOT crash the WhatsApp bot.
        */

        console.error(
            '[AI SHIELD ERROR]',
            error.message
        )

        return false
    }
}

export default aiShieldCommand
