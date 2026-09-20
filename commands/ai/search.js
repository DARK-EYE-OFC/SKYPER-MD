import OpenAI from 'openai'

const searchCommand = {

    name: 'search',

    aliases: [
        'deepsearch',
        'research',
        'websearch',
        'google',
        'find'
    ],

    category: 'ai',

    async execute({
        reply,
        text,
        config
    }) {

        const query = text?.trim()

        if (!query) {
            return reply(
`╭───❒ *DEEP SEARCH* ❒───╮
│
│ 🔎 *DARK-EYE RESEARCH*
│
│ ❌ Please enter something
│ you want me to research.
│
│ Examples:
│
│ .search latest AI news
│
│ .search Who is Elon Musk?
│
│ .search latest WhatsApp
│ updates
│
│ .search how to deploy
│ Node.js on Render
│
╰──────────────────────❒`
            )
        }

        const geminiKey =
            process.env.GEMINI_API_KEY

        const openaiKey =
            process.env.OPENAI_API_KEY

        if (!geminiKey && !openaiKey) {
            return reply(
`╭───❒ *DEEP SEARCH* ❒───╮
│
│ ❌ No search AI is configured.
│
│ Add at least one of these:
│
│ • GEMINI_API_KEY
│ • OPENAI_API_KEY
│
╰──────────────────────❒`
            )
        }

        await reply(
`╭───❒ *DEEP SEARCH* ❒───╮
│
│ 🔎 Researching...
│
│ 🧠 Query:
│ ${query}
│
│ 🌐 Searching live web sources
│ 🔍 Cross-checking information
│ 📚 Preparing research report
│
│ ⏳ Please wait...
│
╰──────────────────────❒`
        )

        /*
        ============================================================
        GEMINI DEEP SEARCH
        ============================================================
        */

        async function searchWithGemini() {

            if (!geminiKey) {
                throw new Error(
                    'GEMINI_API_KEY is not configured'
                )
            }

            const response =
                await fetch(
                    'https://generativelanguage.googleapis.com/v1beta/interactions',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json',

                            'x-goog-api-key':
                                geminiKey
                        },

                        body: JSON.stringify({

                            model:
                                'gemini-3.8-flash',

                            input:
`You are the Deep Research engine for DARK-EYE V2.

Research the user's question using live web search.

USER QUESTION:
${query}

Instructions:

1. Search the web for current and relevant information.
2. Prefer reliable and authoritative sources.
3. Cross-check important claims when possible.
4. Clearly separate confirmed facts from uncertain information.
5. Do not invent facts or sources.
6. Give a concise but useful research report.
7. Include important dates when relevant.
8. If sources disagree, explain the disagreement.
9. Include source URLs/citations in the final response.

Format your answer as:

🔎 RESEARCH RESULT

📌 ANSWER
[direct answer]

📚 KEY FINDINGS
• finding
• finding
• finding

⚠️ IMPORTANT
[uncertainty, limitations or conflicting information if applicable]

🔗 SOURCES
[list the important sources]`,

                            tools: [
                                {
                                    type:
                                        'google_search'
                                }
                            ]
                        })
                    }
                )

            if (!response.ok) {

                const errorText =
                    await response.text()

                throw new Error(
                    `Gemini HTTP ${response.status}: ${errorText}`
                )
            }

            const data =
                await response.json()

            /*
            Gemini Interactions API returns
            model output inside steps.
            */

            let answer = ''

            const sources = []

            for (
                const step of
                data.steps || []
            ) {

                if (
                    step.type ===
                    'model_output'
                ) {

                    for (
                        const block of
                        step.content || []
                    ) {

                        if (
                            block.type === 'text'
                        ) {

                            answer +=
                                block.text || ''

                            /*
                            Collect citation
                            annotations.
                            */

                            for (
                                const annotation of
                                block.annotations || []
                            ) {

                                if (
                                    annotation.type ===
                                    'url_citation'
                                ) {

                                    sources.push({
                                        title:
                                            annotation.title ||
                                            'Source',

                                        url:
                                            annotation.url
                                    })
                                }
                            }
                        }
                    }
                }
            }

            /*
            Fallback for SDK/API response
            variations.
            */

            if (!answer) {

                answer =
                    data.output_text ||
                    data.text ||
                    ''
            }

            if (!answer) {
                throw new Error(
                    'Gemini returned no research result'
                )
            }

            return {
                provider: 'Gemini',
                answer,
                sources
            }
        }

        /*
        ============================================================
        OPENAI DEEP SEARCH FALLBACK
        ============================================================
        */

        async function searchWithOpenAI() {

            if (!openaiKey) {
                throw new Error(
                    'OPENAI_API_KEY is not configured'
                )
            }

            const openai =
                new OpenAI({
                    apiKey: openaiKey
                })

            const response =
                await openai.responses.create({

                    model:
                        'gpt-5.6-luna',

                    tools: [
                        {
                            type:
                                'web_search',

                            search_context_size:
                                'high'
                        }
                    ],

                    input:
`You are DARK-EYE V2 Deep Research.

Research this question using live web search:

${query}

Requirements:

- Search current web sources.
- Cross-check important information.
- Prefer official and authoritative sources.
- Do not invent information.
- Clearly identify uncertainty.
- Give a useful research report.
- Include important dates.
- If sources disagree, explain the disagreement.

Format:

🔎 RESEARCH RESULT

📌 ANSWER
[direct answer]

📚 KEY FINDINGS
• finding
• finding
• finding

⚠️ IMPORTANT
[limitations or disagreements]

🔗 SOURCES
[list important sources]`
                })

            const answer =
                response.output_text

            if (!answer) {
                throw new Error(
                    'OpenAI returned no research result'
                )
            }

            const sources = []

            /*
            OpenAI web-search calls can contain
            the sources used by the search tool.
            */

            for (
                const item of
                response.output || []
            ) {

                if (
                    item.type ===
                    'web_search_call'
                ) {

                    const itemSources =
                        item.action?.sources ||
                        []

                    for (
                        const source of
                        itemSources
                    ) {

                        if (source.url) {

                            sources.push({
                                title:
                                    source.title ||
                                    'Source',

                                url:
                                    source.url
                            })
                        }
                    }
                }
            }

            return {
                provider: 'OpenAI',
                answer,
                sources
            }
        }

        /*
        ============================================================
        RUN RESEARCH
        ============================================================
        */

        let result = null

        let geminiError = null
        let openaiError = null

        /*
        Gemini first
        */

        if (geminiKey) {

            try {

                result =
                    await searchWithGemini()

            } catch (error) {

                geminiError =
                    error

                console.error(
                    '[DEEP SEARCH] Gemini failed:',
                    error.message
                )
            }
        }

        /*
        OpenAI fallback
        */

        if (!result && openaiKey) {

            try {

                result =
                    await searchWithOpenAI()

            } catch (error) {

                openaiError =
                    error

                console.error(
                    '[DEEP SEARCH] OpenAI failed:',
                    error.message
                )
            }
        }

        /*
        ============================================================
        BOTH FAILED
        ============================================================
        */

        if (!result) {

            return reply(
`╭───❒ *DEEP SEARCH ERROR* ❒───╮
│
│ ❌ Research failed.
│
│ 🔴 Gemini:
│ ${geminiError?.message || 'Not available'}
│
│ 🔴 OpenAI:
│ ${openaiError?.message || 'Not available'}
│
│ Please check your API keys
│ and try again.
│
╰──────────────────────────────❒

${config?.watermark || ''}`
            )
        }

        /*
        ============================================================
        FORMAT SOURCES
        ============================================================
        */

        const uniqueSources = []

        const seen =
            new Set()

        for (
            const source of
            result.sources || []
        ) {

            if (
                !source.url ||
                seen.has(source.url)
            ) {
                continue
            }

            seen.add(source.url)

            uniqueSources.push(source)
        }

        const sourceText =
            uniqueSources.length

                ? uniqueSources
                    .slice(0, 8)
                    .map(
                        (source, index) =>
`${index + 1}. ${source.title}
${source.url}`
                    )
                    .join('\n\n')

                : 'Sources were used by the research engine.'

        /*
        ============================================================
        FINAL WHATSAPP RESPONSE
        ============================================================
        */

        const finalMessage =
`╭───❒ *DEEP SEARCH* ❒───╮
│
│ 🔎 *RESEARCH COMPLETE*
│
│ 🧠 Engine: ${result.provider}
│
╰──────────────────────❒

${result.answer}

╭───❒ *SOURCES* ❒───╮
│
${sourceText
    .split('\n')
    .map(line => `│ ${line}`)
    .join('\n')}
│
╰──────────────────────❒

${config?.watermark || ''}`

        return reply(finalMessage)
    }
}

export default searchCommand
