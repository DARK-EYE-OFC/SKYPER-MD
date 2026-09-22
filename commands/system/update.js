const updateCommand = {
    name: 'update',
    aliases: ['upgrade', 'deploy'],
    category: 'system',

    async execute({
        reply,
        isOwner,
        config
    }) {

        if (!isOwner) {
            return reply(
`╭───❒ *ACCESS DENIED* ❒───╮
│
│ ❌ Owner only.
│
╰──────────────────────────❒

${config.watermark}`
            )
        }

        const deployHook =
            process.env.RENDER_DEPLOY_HOOK_URL?.trim()

        try {

            // If a Render deploy hook is configured,
            // trigger a new deployment.
            if (deployHook) {

                const response =
                    await fetch(
                        deployHook,
                        {
                            method: 'POST'
                        }
                    )

                if (!response.ok) {
                    throw new Error(
                        `Render deploy hook returned HTTP ${response.status}`
                    )
                }

                return reply(
`╭───❒ *UPDATE STARTED* ❒───╮
│
│ 🚀 Render deployment triggered.
│
│ 📦 Bot: ${config.botName}
│ 📦 Version: ${config.version}
│ 🌿 Branch: main
│
│ 🔄 Render will:
│ • Pull the latest GitHub commit
│ • Install dependencies
│ • Start the bot
│
│ ⏳ Please wait for the deployment
│    to finish on Render.
│
╰──────────────────────────────❒

${config.watermark}`
                )
            }

            // No deploy hook: explain the normal
            // GitHub → Render workflow.
            return reply(
`╭───❒ *UPDATE INFO* ❒───╮
│
│ 🤖 Bot: ${config.botName}
│ 📦 Version: ${config.version}
│
│ 🌐 Deployment: Render
│ 📁 Source: GitHub
│ 🌿 Branch: main
│
│ ℹ️ No Render deploy hook is configured.
│
│ To update the bot:
│
│ 1. Make your changes
│ 2. Commit them to Git
│ 3. Push to main
│ 4. Render automatically deploys
│    the new commit.
│
╰──────────────────────────❒

${config.watermark}`
            )

        } catch (error) {

            console.error(
                '[UPDATE ERROR]',
                error
            )

            return reply(
`╭───❒ *UPDATE FAILED* ❒───╮
│
│ ❌ Could not trigger deployment.
│
│ Error:
│ ${error.message}
│
╰────────────────────────────❒

${config.watermark}`
            )
        }
    }
}

export default updateCommand
