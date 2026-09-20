import axios from 'axios'
import FormData from 'form-data'

const removeBgCommand = {

    name: 'removebg',

    aliases: [
        'rbg',
        'nobg',
        'removebackground'
    ],

    category: 'ai',

    async execute({
        sock,
        m,
        from,
        reply,
        config
    }) {

        // ─────────────────────────────────────────────
        // CHECK API KEY
        // ─────────────────────────────────────────────

        const apiKey =
            process.env.REMOVEBG_API_KEY

        if (!apiKey) {

            return reply(
`╭───❒ *REMOVE BG* ❒───╮
│
│ ❌ Remove.bg API is not
│ configured.
│
│ Add REMOVEBG_API_KEY
│ to your .env file.
│
╰──────────────────────❒`
            )
        }


        try {

            // ─────────────────────────────────────────
            // FIND IMAGE
            // ─────────────────────────────────────────

            const quoted =
                m.message?.extendedTextMessage
                    ?.contextInfo
                    ?.quotedMessage

            const imageMessage =
                m.message?.imageMessage ||
                quoted?.imageMessage


            if (!imageMessage) {

                return reply(
`╭───❒ *REMOVE BG* ❒───╮
│
│ ❌ Please send or reply to
│ an image.
│
│ Example:
│ Reply to an image with:
│ .removebg
│
╰──────────────────────❒`
                )
            }


            // ─────────────────────────────────────────
            // DOWNLOAD IMAGE
            // ─────────────────────────────────────────

            await reply(
`╭───❒ *REMOVE BG* ❒───╮
│
│ 🖼️ Image found
│
│ ⏳ Removing background...
│
╰──────────────────────❒`
            )


            const { downloadContentFromMessage } =
                await import('@whiskeysockets/baileys')


            const stream =
                await downloadContentFromMessage(
                    imageMessage,
                    'image'
                )


            const chunks = []

            for await (const chunk of stream) {
                chunks.push(chunk)
            }

            const imageBuffer =
                Buffer.concat(chunks)


            // ─────────────────────────────────────────
            // CREATE FORM DATA
            // ─────────────────────────────────────────

            const form =
                new FormData()

            form.append(
                'image_file',
                imageBuffer,
                {
                    filename: 'image.jpg'
                }
            )

            form.append(
                'size',
                'auto'
            )


            // ─────────────────────────────────────────
            // REMOVE BACKGROUND
            // ─────────────────────────────────────────

            const response =
                await axios.post(
                    'https://api.remove.bg/v1.0/removebg',
                    form,
                    {
                        headers: {
                            ...form.getHeaders(),
                            'X-Api-Key': apiKey
                        },

                        responseType: 'arraybuffer',

                        timeout: 120000
                    }
                )


            // ─────────────────────────────────────────
            // SEND RESULT
            // ─────────────────────────────────────────

            await sock.sendMessage(
                from,
                {
                    image: Buffer.from(
                        response.data
                    ),

                    caption:
`╭───❒ *REMOVE BG* ❒───╮
│
│ ✅ Background removed
│
│ 🤖 ${config.botName}
│
╰──────────────────────❒

${config.watermark}`
                },
                {
                    quoted: m
                }
            )


        } catch (error) {

            console.error(
                '[REMOVEBG ERROR]',
                error.response?.data ||
                error.message
            )


            return reply(
`╭───❒ *REMOVE BG ERROR* ❒───╮
│
│ ❌ Failed to remove
│ the background.
│
│ Please try again later.
│
╰────────────────────────────❒

${config.watermark}`
            )
        }
    }
}


export default removeBgCommand
