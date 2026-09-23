const pingCommand = {
    name: 'ping',

    aliases: ['p'],

    category: 'general',

    async execute({
        reply,
        config
    }) {

        const start = Date.now()

        await reply(
`╭───❒ *PONG* ❒───╮
│
│ ⚡ Speed: ${ping}ms
│ 🤖 Bot: ${config.botName}
│ 📦 Version: ${config.version}
│ 🟢 Status: ONLINE
│
╰─────────────────❒

${config.watermark}`
        )
    }
}

export default pingCommand
