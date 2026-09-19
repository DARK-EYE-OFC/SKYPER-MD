import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export default {
    name: 'update',
    aliases: ['upgrade', 'updatebot'],
    category: 'system',

    async execute({
        sock,
        m,
        from,
        reply,
        config,
        isOwner
    }) {

        // Only owner can update the bot
        if (!isOwner) {
            return reply(
                `❌ Only the owner can update ${config.botName}.`
            )
        }

        await reply(
            `╭───❒ *${config.botName} UPDATE* ❒───╮
│ 🔎 Checking repository...
│
│ Please wait...
╰──────────────────────────────❒`
        )

        try {

            // Check whether Git exists
            await execAsync('git --version')


            // Make sure this is actually a Git repository
            await execAsync('git rev-parse --is-inside-work-tree')


            // Get remote repository
            let remoteUrl = ''

            try {

                const {
                    stdout
                } = await execAsync(
                    'git config --get remote.origin.url'
                )

                remoteUrl =
                    stdout.trim()

            } catch {
                remoteUrl = ''
            }


            // Get current branch
            let branch = 'main'

            try {

                const {
                    stdout
                } = await execAsync(
                    'git branch --show-current'
                )

                if (stdout.trim()) {
                    branch =
                        stdout.trim()
                }

            } catch {
                // Keep main
            }


            // Fetch latest information
            await execAsync(
                `git fetch origin ${branch}`,
                {
                    timeout: 120000
                }
            )


            // Get current commit
            const {
                stdout: currentCommit
            } = await execAsync(
                'git rev-parse HEAD'
            )


            // Get remote commit
            const {
                stdout: remoteCommit
            } = await execAsync(
                `git rev-parse origin/${branch}`
            )


            const current =
                currentCommit.trim()

            const latest =
                remoteCommit.trim()


            // Already updated
            if (current === latest) {

                return reply(
                    `╭───❒ *${config.botName}* ❒───╮
│ ✅ *Bot is already up to date*
│
│ 🤖 Version: ${config.version}
│ 🌿 Branch: ${branch}
│
│ No new commits found.
╰──────────────────────────────❒

${config.watermark}`
                )
            }


            // Get commits that will be installed
            const {
                stdout: commits
            } = await execAsync(
                `git log --oneline HEAD..origin/${branch} -10`
            )


            // Get changed files
            const {
                stdout: changedFiles
            } = await execAsync(
                `git diff --name-status HEAD..origin/${branch}`
            )


            const commitList =
                commits.trim() ||
                'New repository changes'

            const fileList =
                changedFiles.trim() ||
                'Repository files changed'


            await reply(
                `╭───❒ *UPDATE FOUND* ❒───╮
│ 🤖 ${config.botName}
│
│ 📦 Current:
│ ${current.slice(0, 12)}
│
│ 🚀 Latest:
│ ${latest.slice(0, 12)}
│
│ 🌿 Branch:
│ ${branch}
│
│ 📝 New commits:
│
${commitList
    .split('\n')
    .slice(0, 10)
    .map(line => `│ ${line}`)
    .join('\n')}
│
│ 📁 Changed files:
│
${fileList
    .split('\n')
    .slice(0, 15)
    .map(line => `│ ${line}`)
    .join('\n')}
╰──────────────────────────────❒`
            )


            await reply(
                `⏳ Installing the latest repository version...`
            )


            // Make sure there are no local modifications
            const {
                stdout: status
            } = await execAsync(
                'git status --porcelain'
            )


            if (status.trim()) {

                return reply(
                    `⚠️ *Update stopped.*

There are local changes in the repository.

I won't overwrite them automatically.

Run:

git status

and save/commit your changes before updating.`
                )
            }


            // Pull latest code
            const {
                stdout: pullOutput
            } = await execAsync(
                `git pull --ff-only origin ${branch}`,
                {
                    timeout: 180000
                }
            )


            let dependencyMessage =
                'Dependencies were not changed.'


            // Check whether package.json changed
            let packageChanged = false

            try {

                const {
                    stdout: packageDiff
                } = await execAsync(
                    `git diff --name-only ${current} ${latest} -- package.json package-lock.json`
                )

                packageChanged =
                    Boolean(
                        packageDiff.trim()
                    )

            } catch {
                packageChanged = false
            }


            // Install dependencies when required
            if (packageChanged) {

                await reply(
                    `📦 *package.json changed.*

Installing new dependencies...`
                )

                await execAsync(
                    'npm install --legacy-peer-deps',
                    {
                        timeout: 300000
                    }
                )

                dependencyMessage =
                    'Dependencies installed successfully.'
            }


            await reply(
                `╭───❒ *UPDATE COMPLETE* ❒───╮
│ ✅ Repository updated
│
│ 🤖 ${config.botName}
│
│ 📦 ${dependencyMessage}
│
│ 🔄 Restarting bot...
╰──────────────────────────────❒`
            )


            // Give WhatsApp time to receive the message
            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        3000
                    )
            )


            // Restart process
            process.exit(0)


        } catch (error) {

            console.error(
                '[UPDATE ERROR]',
                error
            )

            await reply(
                `╭───❒ *UPDATE FAILED* ❒───╮
│ ❌ Could not update the bot.
│
│ Error:
│ ${error.message}
╰──────────────────────────────❒

${config.watermark}`
            )
        }
    }
  }
