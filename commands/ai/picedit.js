import OpenAI from 'openai'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const picEditCommand = {

    name: 'picedit',

    aliases: [
        'editpic',
        'imageedit',
        'photoedit'
    ],

    category: 'ai',

    async execute({
        sock,
        m,
        from,
        reply,
        config,
        text,
        args
    }) {

        // ─────────────────────────────────────────────
        // GET EDIT PROMPT
        // ─────────────────────────────────────────────

        const prompt =
            text?.trim() ||
            args?.join(' ')?.trim()


        if (!prompt) {

            return reply(
`╭───❒ *PIC EDITOR* ❒───╮
│
│ ❌ Please describe how you
│ want to edit the picture.
│
│ Examples:
│
│ .picedit enhance quality to 8k
│ studio fashion portrait
│
│ .picedit change background
│ to a beach
│
│ .picedit make it cinematic
│
╰────────────────────────❒`
            )
        }


        // ─────────────────────────────────────────────
        // CHECK OPENAI KEY
        // ─────────────────────────────────────────────

        const apiKey =
            process.env.OPENAI_API_KEY


        if (!apiKey) {

            return reply(
`╭───❒ *PIC EDITOR* ❒───╮
│
│ ❌ OpenAI API is not configured.
│
│ Add OPENAI_API_KEY to
│ your .env file.
│
╰────────────────────────❒`
            )
        }


        // ─────────────────────────────────────────────
        // FIND IMAGE
        // ─────────────────────────────────────────────

        const quotedMessage =
            m.message
                ?.extendedTextMessage
                ?.contextInfo
                ?.quotedMessage


        const imageMessage =
            m.message?.imageMessage ||
            quotedMessage?.imageMessage


        if (!imageMessage) {

            return reply(
`╭───❒ *PIC EDITOR* ❒───╮
│
│ ❌ No image found.
│
│ Send an image with:
│
│ .picedit enhance quality
│
│ OR reply to an image with:
│
│ .picedit change background
│ to a beach
│
╰────────────────────────❒`
            )
        }


        // ─────────────────────────────────────────────
        // PROCESSING MESSAGE
        // ─────────────────────────────────────────────

        await reply(
`╭───❒ *PIC EDIT* ❒───╮
│
│ 🖼️ Image received
│
│ ✨ Processing...
│
│ 📝 Request:
│ ${prompt}
│
│ ⏳ Please wait...
╰──────────────────────❒`
        )


        try {

            // ─────────────────────────────────────────
            // DOWNLOAD WHATSAPP IMAGE
            // ─────────────────────────────────────────

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


            if (!imageBuffer.length) {

                return reply(
                    '❌ Could not download the image.'
                )
            }


            // ─────────────────────────────────────────
            // OPENAI CLIENT
            // ─────────────────────────────────────────

            const openai =
                new OpenAI({
                    apiKey
                })


            // ─────────────────────────────────────────
            // IMAGE EDIT
            // ─────────────────────────────────────────

            const result =
                await openai.images.edit({

                    model: 'gpt-image-2',

                    image: imageBuffer,

                    prompt,

                    size: '1024x1024'
                })


            // ─────────────────────────────────────────
            // GET GENERATED IMAGE
            // ─────────────────────────────────────────

            const imageData =
                result?.data?.[0]?.b64_json


            if (!imageData) {

                console.error(
                    '[PICEDIT RESPONSE]',
                    result
                )

                return reply(
`╭───❒ *PIC EDIT ERROR* ❒───╮
│
│ ❌ OpenAI did not return
│ an edited image.
│
╰────────────────────────❒`
                )
            }


            // ─────────────────────────────────────────
            // BASE64 → BUFFER
            // ─────────────────────────────────────────

            const editedImage =
                Buffer.from(
                    imageData,
                    'base64'
                )


            // ─────────────────────────────────────────
            // SEND EDITED IMAGE
            // ─────────────────────────────────────────

            await sock.sendMessage(
                from,
                {
                    image: editedImage,

                    caption:
`╭───❒ *PIC EDIT* ❒───╮
│
│ ✨ *EDIT COMPLETE*
│
│ 📝 Request:
│ ${prompt}
│
│ 🤖 Bot: ${config.botName}
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
                '[PICEDIT ERROR]',
                error
            )


            const errorMessage =
                error?.error?.message ||
                error?.response?.data?.error?.message ||
                error?.message ||
                'Unknown OpenAI error'


            return reply(
`╭───❒ *PIC EDIT ERROR* ❒───╮
│
│ ❌ Image editing failed.
│
│ ${errorMessage}
│
╰──────────────────────────❒

${config.watermark}`
            )
        }
    }
}


export default picEditCommand
