import { App } from "@slack/bolt"
import { parse } from "../commands/commandParser"
import { CommandRunner } from "../commands/commands"
import { Repository } from "../db/user-repository"
import { sayHelp } from "./help"

export const setupEventHandling = (app: App, repository: Repository): void => app.message(async ({message, say}): Promise<void> => {
    if(!message.text) {
        // TODO How to handle? This should not event be possible in our case.
        console.warn("Received an empty message. Will respond with 'help' message.", message)
        return sayHelp(say)
    }


    const parserResult = parse(message.text)
    if(!parserResult.status) {
        console.warn("Failed to parse received message. Will respond with 'help' message.", message.text)
        return sayHelp(say)
    }
    
    const commandRunner = new CommandRunner({slackId: message.user}, repository)
    const command = parserResult.value

    if (command.name === "check") {
        const result = await commandRunner.runMiteCommand(command)
        console.log(`Finished running command ${command.name}`)

        const message = "Your time entries for the following dates are missing or contain 0 minutes:\n"
            + result.map(date => `https://leanovate.mite.yo.lk/#${date.format("YYYY/MM/DD")}`)
                .join("\n")
        say(message)
    } else {
        await commandRunner.runMiteCommand(command)
        await say("Erfolg :)")
    }
})
