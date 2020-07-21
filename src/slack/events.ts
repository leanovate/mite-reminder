import { App, SayFn, BlockAction } from "@slack/bolt"
import { WebAPICallResult } from "@slack/web-api"
import { MiteApiError } from "mite-api"
import { Moment } from "moment"
import { parse } from "../commands/commandParser"
import { doCheck, doRegister, doUnregister, Failures } from "../commands/commands"
import { Repository } from "../db/user-repository"
import { createUserContext } from "./createUserContext"
import { sayHelp } from "./help"
import { slackUserResolver } from "./slackUserResolver"
import { missingTimeEntriesBlock } from "./blocks"
import { publishDefaultHomeTab, Actions } from "./home"

export type SlackApiUser = {
    user?: {profile?: {email?: string}}
} & WebAPICallResult

export const setupMessageHandling = (app: App, repository: Repository): void => app.message(async ({ message, say }): Promise<void> => {
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

export const setupHomeTabHandling : (app: App, repository: Repository) => void = (app, repository) => {
    console.log("Setting up home tab event handling")

    app.event("app_home_opened", async ({event}) => {
        console.log("Event", event)
        if(event.tab !== "home") {
            return
        }

        await publishDefaultHomeTab(app, event.user, repository)
    })
}

export const setupActionHandling : (app: App, repository: Repository) => void = (app, repository) => {
    console.log("Setting up action handling")

    app.action(Actions.Register, async ({body, action, ack}) => {
        console.log("Register action received.", action)
        await ack()

        // await doRegister({name: "register"}, createUserContext(repository, body.user.id), slackUserResolver(app))
        await doRegister({name: "register"}, createUserContext(repository, body.user.id), async () => ({email: "kai.noffke@leanovate.de"})) // TODO Handle failures
        publishDefaultHomeTab(app, body.user.id, repository)
    })

    app.action(Actions.Unregister, async ({body, action, ack}) => {
        console.log("Unregister action received.", action)
        await ack()

        await doUnregister(createUserContext(repository, body.user.id)) // TODO Handle failures
        publishDefaultHomeTab(app, body.user.id, repository)
    })
}

async function displayCheckResult(say: SayFn, timesOrFailure: Moment[] | Failures) {
    try {
        if (timesOrFailure === Failures.UserIsUnknown || timesOrFailure === Failures.ApiKeyIsMissing) {
            console.warn(timesOrFailure)
            await sayMissingApiKey(say)
        } else {
            await say(missingTimeEntriesBlock(timesOrFailure))
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
