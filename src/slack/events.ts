import { App, SayFn } from "@slack/bolt"
import { parse, CheckCommand, MiteCommand } from "../commands/commandParser"
import { CommandRunner, Failures } from "../commands/commands"
import { Repository } from "../db/user-repository"
import { sayHelp } from "./help"
import { createUserContext } from "./createUserContext"

export const setupEventHandling = (app: App, repository: Repository): void => app.message(async ({ message, say }): Promise<void> => {
    if (!message.text) {
        console.warn("Received an empty message. Will respond with 'help' message.", message)
        return sayHelp(say)
    }

    const parserResult = parse(message.text)
    if (!parserResult.status) {
        console.warn("Failed to parse received message. Will respond with 'help' message.", message.text)
        return sayHelp(say)
    }

    const context = createUserContext(repository, message.user)
    if(context === Failures.ApiKeyIsMissing) {
        return sayMissingApiKey(say)
    }

    const commandRunner = new CommandRunner(context)
    const command = parserResult.value

    if (command.name === "check") {
        await handleCheckCommand(say, commandRunner, command)
    } else {
        await handleMiteCommand(say, commandRunner, command)
    }
})

async function handleCheckCommand(say: SayFn, commandRunner: CommandRunner, command: CheckCommand) {
    try {
        const result = await commandRunner.runMiteCommand(command)
        console.log(`Finished running command ${command.name}`)

        if (result === Failures.UserIsUnknown) {
            console.warn(result)
            await sayMissingApiKey(say)
        } else {
            const message = result.length > 0
                ? "Your time entries for the following dates are missing or contain 0 minutes:\n"
                + result.map(date => `https://leanovate.mite.yo.lk/#${date.format("YYYY/MM/DD")}`)
                    .join("\n")
                : "You completed all your time entries."
            await say(message)
        }
    } catch (e) {
        reportError(say)(e)
    }
}

async function handleMiteCommand(say: SayFn, commandRunner: CommandRunner, command: Exclude<MiteCommand, CheckCommand>) {
    try {
        await commandRunner.runMiteCommand(command)
        await say("Erfolg :)") // TODO
    } catch (e) {
        await reportError(say)(e)
    }
}

function reportError(say: SayFn): (error: Error) => Promise<void> {
    return async (error: Error) => {
        console.error("Failed to execute command because of ", error)
        await say(`Sorry, I couldn't to that because of ${error.message}`)
    }
}

async function sayMissingApiKey(say: SayFn): Promise<void> {
    await say("Sorry, I can't get your times by myself. Please register with your mite api key from https://leanovate.mite.yo.lk/myself and send `register <YOUR_MITE_API_KEY>`.")
}
