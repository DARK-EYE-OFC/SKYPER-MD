const tagAllCommand = {

    name: 'tagall',

    aliases: [
        'everyone',
        'all'
    ],

    category: 'group',

    async execute({
        sock,
        m,
        from,
        reply,
        isGroup,
        isAdmin,
        isOwner,
        text,
        config
    }) {

        // ─────────────────────────────────────────────
        // GROUP CHECK
        // ─────────────────────────────────────────────

        if (!isGroup) {
            return reply(
                '❌ This command can only be used in a group.'
            )
        }


        // ─────────────────────────────────────────────
        // ADMIN CHECK
        // ─────────────────────────────────────────────

        if (!isAdmin && !isOwner) {
            return reply(
                '❌ Only group admins can use this command.'
            )
        }


        try {

            // ─────────────────────────────────────────
            // GROUP INFO
            // ─────────────────────────────────────────

            const metadata =
                await sock.groupMetadata(from)

            const participants =
                metadata.participants || []


            if (!participants.length) {
                return reply(
                    '❌ I could not find the group members.'
                )
            }


            // ─────────────────────────────────────────
            // TAG MESSAGE
            // ─────────────────────────────────────────

            const tagMessage =
                text?.trim() ||
                'Hello everyone 👋🏽'


            // ─────────────────────────────────────────
            // MENTIONS
            // ─────────────────────────────────────────

            const mentions =
                participants.map(
                    participant => participant.id
                )


            // ─────────────────────────────────────────
            // NUMBERED MEMBERS
            // ─────────────────────────────────────────

            const tagText =
                participants
                    .map(
                        (participant, index) =>
                            `│${index + 1}. 👋🏽 @${participant.id.split('@')[0]}`
                    )
                    .join('\n')


            // ─────────────────────────────────────────
            // BOX MENU
            // ─────────────────────────────────────────

            const message =
`╭───❒ *TAG ALL* ❒───╮
│
│ 📢 *GROUP:* ${metadata.subject || 'Group'}
│ 👥 *MEMBERS:* ${participants.length}
│
│ 💬 *MESSAGE:*
│ ${tagMessage}
│
${tagText}
│
╰────────────────────❒

${config?.watermark || '> *♤powered by DARK-EYE OFC DEV*'}`


            // ─────────────────────────────────────────
            // SEND TAG ALL
            // ─────────────────────────────────────────

            await sock.sendMessage(
                from,
                {
                    text: message,
                    mentions
                },
                {
                    quoted: m
                }
            )


        } catch (error) {

            console.error(
                '[TAGALL ERROR]',
                error
            )

            return reply(
`❌ *Tagall failed.*

${error.message}`
            )
        }
    }
}


export default tagAllCommand
