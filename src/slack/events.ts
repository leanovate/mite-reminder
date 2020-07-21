import { App, SayFn } from "@slack/bolt"
import { WebAPICallResult } from "@slack/web-api"
import { MiteApiError } from "mite-api"
import { Moment } from "moment"
import { parse } from "../commands/commandParser"
import { doCheck, doRegister, doUnregister, Failures } from "../commands/commands"
import { Repository } from "../db/user-repository"
import { createUserContext } from "./createUserContext"
import { sayHelp } from "./help"
import { slackUserResolver } from "./slackUserResolver"

export type SlackApiUser = {
    user?: {profile?: {email?: string}}
} & WebAPICallResult

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
    const command = parserResult.value

    switch(command.name) {
    case "check":
        await doCheck(context).then(result => displayCheckResult(say, result))
        break
    case "register":
        await doRegister(command, context, slackUserResolver(app)).then(result => displayRegisterResult(say, result))
        break
    case "unregister":
        await doUnregister(context).then(() => displayUnregisterResult(say))
    }
})

async function displayCheckResult(say: SayFn, result: Moment[] | Failures) {
    try {
        if (result === Failures.UserIsUnknown || result === Failures.ApiKeyIsMissing) {
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
        reportError(say, e)
    }
}

async function displayRegisterResult(say: SayFn, result: void|Failures): Promise<void> {
    if(result === Failures.ApiKeyIsMissing || result === Failures.UserIsUnknown) {
        return sayMissingApiKey(say)  
    } 

    await say("Success!")
}

async function displayUnregisterResult(say: SayFn): Promise<void> {
    await say("Success!")   
}

async function reportError(say: SayFn, error: Error | MiteApiError) : Promise<void> {
    console.error("Failed to execute command because of ", error)
    const message = isMiteApiError(error) ? error.error : error.message
    await say(`Sorry, I couldn't to that because of: "${message}"`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMiteApiError(candidate: any) : candidate is MiteApiError {
    return !!candidate.error
}

async function sayMissingApiKey(say: SayFn): Promise<void> {
    await say("Sorry, I can't get your times by myself. Please register with your mite api key from https://leanovate.mite.yo.lk/myself and send `register <YOUR_MITE_API_KEY>`.")
}
