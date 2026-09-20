import OpenAI from 'openai'

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

        // ─────────────────────────────────────────────
        // GET PROMPT
        // ─────────────────────────────────────────────

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


        // ─────────────────────────────────────────────
        // CHECK OPENAI API KEY
        // ─────────────────────────────────────────────

        const apiKey =
            process.env.OPENAI_API_KEY

        if (!apiKey) {

            return reply(
`╭───❒ *AI IMAGE GENERATOR* ❒───╮
│
│ ❌ OpenAI API is not configured.
│
│ Add OPENAI_API_KEY to your
│ .env file.
│
╰──────────────────────────────❒`
            )
        }


        // ─────────────────────────────────────────────
        // START OPENAI CLIENT
        // ─────────────────────────────────────────────

        const openai =
            new OpenAI({
                apiKey
            })


        // ─────────────────────────────────────────────
        // GENERATING MESSAGE
        // ─────────────────────────────────────────────

        await reply(
`╭───❒ *IMAGINE AI* ❒───╮
│
│ 🎨 Generating image...
│
│ 📝 Prompt:
│ ${prompt}
│
│ ⏳ Please wait...
╰───────────────────────❒`
        )


        try {

            // ─────────────────────────────────────────
            // GENERATE IMAGE
            // ─────────────────────────────────────────

            const result =
                await openai.images.generate({
                    model: 'gpt-image-1',
                    prompt,
                    size: '1024x1024'
                })


            // ─────────────────────────────────────────
            // GET BASE64 IMAGE
            // ─────────────────────────────────────────

            const imageData =
                result?.data?.[0]?.b64_json


            if (!imageData) {

                console.error(
                    '[IMAGINE RESPONSE]',
                    result
                )

                return reply(
`❌ *Image generation failed.*

No image was returned by OpenAI.`
                )
            }


            // ─────────────────────────────────────────
            // CONVERT BASE64 TO BUFFER
            // ─────────────────────────────────────────

            const imageBuffer =
                Buffer.from(
                    imageData,
                    'base64'
                )


            // ─────────────────────────────────────────
            // SEND IMAGE TO WHATSAPP
            // ─────────────────────────────────────────

            await sock.sendMessage(
                from,
                {
                    image: imageBuffer,

                    caption:
`╭───❒ *AI IMAGE* ❒───╮
│
│ 🎨 *Prompt:*
│ ${prompt}
│
│ 🤖 *Bot:* ${config.botName}
│
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
                error
            )


            const errorMessage =
                error?.error?.message ||
                error?.response?.data?.error?.message ||
                error?.message ||
                'Unknown OpenAI error'


            await reply(
`╭───❒ *IMAGINE ERROR* ❒───╮
│
│ ❌ Image generation failed.
│
│ ${errorMessage}
│
╰──────────────────────────❒

${config.watermark}`
            )
        }
    }
}


export default imagineCommand
