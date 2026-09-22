import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

const SESSION_PREFIX = 'SKYPER-MD~'
const SESSION_VERSION = 1

function collectFiles(dir, baseDir = dir) {
    const result = {}

    if (!fs.existsSync(dir)) {
        return result
    }

    const entries = fs.readdirSync(dir, {
        withFileTypes: true
    })

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
            Object.assign(
                result,
                collectFiles(fullPath, baseDir)
            )
        } else if (entry.isFile()) {
            const relativePath =
                path.relative(baseDir, fullPath)

            const data =
                fs.readFileSync(fullPath)

            result[relativePath] =
                data.toString('base64')
        }
    }

    return result
}

function restoreFiles(dir, files) {
    fs.mkdirSync(dir, {
        recursive: true
    })

    for (const [relativePath, base64] of Object.entries(files)) {
        const fullPath =
            path.join(dir, relativePath)

        const parent =
            path.dirname(fullPath)

        fs.mkdirSync(parent, {
            recursive: true
        })

        fs.writeFileSync(
            fullPath,
            Buffer.from(base64, 'base64')
        )
    }
}

export function generateSessionId(sessionDir) {
    if (!fs.existsSync(sessionDir)) {
        throw new Error(
            'Session directory does not exist.'
        )
    }

    const files =
        collectFiles(sessionDir)

    if (!files['creds.json']) {
        throw new Error(
            'creds.json was not found in the session.'
        )
    }

    const payload = {
        version: SESSION_VERSION,
        bot: 'SKYPER-MD',
        createdAt: new Date().toISOString(),
        files
    }

    const json =
        JSON.stringify(payload)

    const compressed =
        zlib.gzipSync(
            Buffer.from(json)
        )

    const encoded =
        compressed
            .toString('base64url')

    return SESSION_PREFIX + encoded
}

export function restoreSessionFromId(
    sessionId,
    sessionDir
) {
    if (!sessionId) {
        throw new Error(
            'Session ID is empty.'
        )
    }

    if (!sessionId.startsWith(SESSION_PREFIX)) {
        throw new Error(
            'Invalid SKYPER-MD Session ID.'
        )
    }

    const encoded =
        sessionId
            .slice(SESSION_PREFIX.length)

    if (!encoded) {
        throw new Error(
            'Session ID contains no data.'
        )
    }

    let payload

    try {
        const compressed =
            Buffer.from(
                encoded,
                'base64url'
            )

        const json =
            zlib.gunzipSync(
                compressed
            ).toString()

        payload =
            JSON.parse(json)

    } catch {
        throw new Error(
            'Session ID is corrupted or invalid.'
        )
    }

    if (
        payload.version !==
        SESSION_VERSION
    ) {
        throw new Error(
            'Unsupported Session ID version.'
        )
    }

    if (
        !payload.files ||
        typeof payload.files !== 'object'
    ) {
        throw new Error(
            'Session ID contains no session files.'
        )
    }

    fs.mkdirSync(sessionDir, {
        recursive: true
    })

    restoreFiles(
        sessionDir,
        payload.files
    )

    return {
        restored: true,
        files: Object.keys(
            payload.files
        ).length
    }
}

export function isSessionId(value) {
    return typeof value === 'string' &&
        value.startsWith(SESSION_PREFIX)
}

export function getSessionIdFromEnv() {
    const value =
        process.env.SESSION_ID?.trim()

    if (!value) {
        return null
    }

    return isSessionId(value)
        ? value
        : null
}
