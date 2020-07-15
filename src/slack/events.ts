import { App, SayFn } from "@slack/bolt"
import { parse } from "../commands/commandParser"
import { CommandRunner } from "../commands/commands"
import { Repository } from "../db/user-repository"

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
    
    await new CommandRunner({slackId: message.user}, repository).runMiteCommand(parserResult.value)
})

function sayHelp(say: SayFn): Promise<void> {
    return say("I will respond with a proper 'help' message.")
        .then(() => undefined)
}
