import { App, SayFn } from "@slack/bolt"
import { parse, CheckCommand, MiteCommand } from "../commands/commandParser"
import { CommandRunner, Failures } from "../commands/commands"
import { Repository } from "../db/user-repository"
import { sayHelp } from "./help"
import config from "../config"
import { createMiteApi } from "../mite/mite-api-wrapper"
import { UserContext } from "./userContext"

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

    const context: UserContext = createUserContext(repository, message.user)

    const commandRunner = new CommandRunner(context)
    const command = parserResult.value

    if (command.name === "check") {
        await handleCheckCommand(say, commandRunner, command)
    } else {
        await handleMiteCommand(say, commandRunner, command)
    }
})

// TODO Move to different file
export function createUserContext(repository: Repository, slackId: string): UserContext {
    const user = repository.loadUser(slackId)
    const miteApiKey = user?.miteApiKey ?? config.miteApiKey
    if (!miteApiKey) {
        // TODO inform user that a mite api key needs to be provided
        throw new Error(Failures.ApiKeyIsMissing)
    }

    return {
        repository,
        slackId,
        miteApi: createMiteApi(miteApiKey, config.miteAccountName),
        config
    }
}

async function handleCheckCommand(say: SayFn, commandRunner: CommandRunner, command: CheckCommand) {
    try {
        const result = await commandRunner.runMiteCommand(command)
        console.log(`Finished running command ${command.name}`)

        if (result === Failures.ApiKeyIsMissing || result === Failures.UserIsUnknown) {
            console.warn(result)
            say("Sorry, I can't get your times by myself. Please register with your mite api key from https://leanovate.mite.yo.lk/myself and send `register <YOUR_MITE_API_KEY>`.")
        } else {
            // TODO show a different message if no entries are missing
            say("Your time entries for the following dates are missing or contain 0 minutes:\n"
                + result.map(date => `https://leanovate.mite.yo.lk/#${date.format("YYYY/MM/DD")}`)
                    .join("\n"))
        }
    } catch (e) {
        reportError(say)(e)
    }
}

async function handleMiteCommand(say: SayFn, commandRunner: CommandRunner, command: Exclude<MiteCommand, CheckCommand>) {
    try {
        await commandRunner.runMiteCommand(command)
        await say("Erfolg :)")
    } catch (e) {
        await reportError(say)(e)
    }
}

function reportError(say: SayFn): (error: Error) => Promise<void> {
    return async (error: Error) => {
        console.error("Failed to execute command because of ", error) // TODO also reports error "User is unknown and needs to register with his/her own api key.", which isn't really an error case here
        await say(`Sorry, I couldn't to that because of ${error.message}`)
    }
}
