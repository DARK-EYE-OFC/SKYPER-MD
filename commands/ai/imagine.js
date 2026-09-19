import axios from 'axios'

const imagineCommand = {

    name: 'imagine',

    aliases: [
        'imageai',
        'genimage',
        'generate'
    ],

    category: 'ai',

    async execute({
        args,
        text,
        reply,
        config,
        sock,
        m,
        from
    }) {

        // ───────────────────────────────────────────────────────
        // CHECK PROMPT
        // ───────────────────────────────────────────────────────

        const prompt =
            text?.trim() ||
            args?.join(' ')?.trim()

        if (!prompt) {

            return reply(
`╭───❒ *AI IMAGE GENERATOR* ❒───╮
│
│ ❌ Please provide a prompt.
│
│ Example:
│ .imagine a futuristic city
│
╰──────────────────────────────❒`
            )
        }


        // ───────────────────────────────────────────────────────
        // API CONFIG
        // ───────────────────────────────────────────────────────

        const apiUrl =
            process.env.IMAGE_API_URL

        const apiKey =
            process.env.IMAGE_API_KEY ||
            config?.apiKeys?.image


        if (!apiUrl) {

            return reply(
`╭───❒ *AI IMAGE GENERATOR* ❒───╮
│ ⚠️ Image generation is not
│ configured yet.
│
│ Add IMAGE_API_URL to your
│ .env file first.
╰──────────────────────────────❒`
            )
        }


        // ───────────────────────────────────────────────────────
        // GENERATING
        // ───────────────────────────────────────────────────────

        await reply(
`╭───❒ *IMAGINE AI* ❒───╮
│ 🎨 Generating image...
│
│ 📝 Prompt:
│ ${prompt}
│
│ ⏳ Please wait...
╰───────────────────────❒`
        )


        try {

            // ───────────────────────────────────────────────
            // API REQUEST
            // ───────────────────────────────────────────────

            const response =
                await axios.post(
                    apiUrl,
                    {
                        prompt
                    },
                    {
                        headers: apiKey
                            ? {
                                Authorization:
                                    `Bearer ${apiKey}`,

                                'Content-Type':
                                    'application/json'
                            }
                            : {
                                'Content-Type':
                                    'application/json'
                            },

                        timeout: 120000
                    }
                )


            const data =
                response.data


            // ───────────────────────────────────────────────
            // FIND IMAGE URL
            // ───────────────────────────────────────────────

            const imageUrl =
                data?.image ||
                data?.imageUrl ||
                data?.url ||
                data?.output ||
                data?.result?.image ||
                data?.result?.url


            if (!imageUrl) {

                console.error(
                    '[IMAGINE API RESPONSE]',
                    data
                )

                return reply(
`❌ *Image generation failed.*

The API did not return an image URL.`
                )
            }


            // ───────────────────────────────────────────────
            // SEND IMAGE
            // ───────────────────────────────────────────────

            await sock.sendMessage(
                from,
                {
                    image: {
                        url: imageUrl
                    },

                    caption:
`╭───❒ *AI IMAGE* ❒───╮
│ 🎨 Prompt:
│ ${prompt}
│
│ 🤖 ${config.botName}
╰────────────────────❒

${config.watermark}`
                },
                {
                    quoted: m
                }
            )


        } catch (error) {

            console.error(
                '[IMAGINE ERROR]',
                error.response?.data ||
                error.message
            )

            await reply(
`╭───❒ *IMAGINE ERROR* ❒───╮
│ ❌ Failed to generate image.
│
│ Please try again later.
╰───────────────────────────❒

${config.watermark}`
            )
        }
    }
}

export default imagineCommand
