import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const commands = new Map()

// ═══════════════════════════════════════════════════════════════
// LOAD COMMANDS
// ═══════════════════════════════════════════════════════════════

export async function loadCommands() {

    commands.clear()

    const categories =
        fs.readdirSync(__dirname, {
            withFileTypes: true
        })
        .filter(item =>
            item.isDirectory()
        )

    let loaded = 0
    let skipped = 0

    for (const category of categories) {

        const categoryPath =
            path.join(
                __dirname,
                category.name
            )

        const files =
            fs.readdirSync(
                categoryPath
            )
            .filter(file =>
                file.endsWith('.js')
            )

        for (const file of files) {

            const filePath =
                path.join(
                    categoryPath,
                    file
                )

            try {

                const module =
                    await import(
                        pathToFileURL(
                            filePath
                        ).href
                    )

                const command =
                    module.default

                if (!command) {

                    console.log(
                        `⚠️ Skipped ${category.name}/${file}: no default export`
                    )

                    skipped++
                    continue
                }

                if (!command.name) {

                    console.log(
                        `⚠️ Skipped ${category.name}/${file}: missing command name`
                    )

                    skipped++
                    continue
                }


                // Main command
                const commandName =
                    command.name.toLowerCase()


                // Prevent duplicate command
                if (commands.has(commandName)) {

                    console.log(
                        `⚠️ Duplicate command: ${commandName} (${file})`
                    )

                    skipped++
                    continue
                }


                commands.set(
                    commandName,
                    command
                )


                // Aliases
                if (Array.isArray(command.aliases)) {

                    for (const alias of command.aliases) {

                        const aliasName =
                            alias.toLowerCase()


                        if (commands.has(aliasName)) {

                            console.log(
                                `⚠️ Duplicate alias: ${aliasName} (${file})`
                            )

                            continue
                        }


                        commands.set(
                            aliasName,
                            command
                        )
                    }
                }


                loaded++

                console.log(
                    `✅ Loaded: ${category.name}/${file}`
                )

            } catch (error) {

                skipped++

                console.error(
                    `❌ Failed: ${category.name}/${file}`
                )

                console.error(
                    error.message
                )
            }
        }
    }


    console.log('')
    console.log(
        `📦 Commands loaded: ${loaded}`
    )

    console.log(
        `⚠️ Commands skipped: ${skipped}`
    )

    console.log(
        `🔑 Registered names/aliases: ${commands.size}`
    )
}


// ═══════════════════════════════════════════════════════════════
// HANDLE COMMAND
// ═══════════════════════════════════════════════════════════════

export async function handleCommand(context) {

    const {
        cmd,
        reply
    } = context

    if (!cmd) {
        return false
    }


    const command =
        commands.get(
            cmd.toLowerCase()
        )


    // Command doesn't exist
    if (!command) {
        return false
    }


    try {

        await command.execute(
            context
        )

        return true

    } catch (error) {

        console.error(
            `[COMMAND ERROR] ${cmd}`,
            error
        )

        try {

            await reply(
                `❌ *Command Error*

${error.message}`
            )

        } catch {
            // Ignore reply errors
        }

        return false
    }
}


// ═══════════════════════════════════════════════════════════════
// GET COMMAND
// ═══════════════════════════════════════════════════════════════

export function getCommand(name) {

    return commands.get(
        name?.toLowerCase()
    )
}


// ═══════════════════════════════════════════════════════════════
// GET ALL COMMANDS
// ═══════════════════════════════════════════════════════════════

export function getCommands() {

    return [...new Set(
        commands.values()
    )]
}
