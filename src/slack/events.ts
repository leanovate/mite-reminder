import { App, BlockAction, SayFn } from "@slack/bolt"
import { WebAPICallResult } from "@slack/web-api"
import { either, taskEither } from "fp-ts"
import { pipe } from "fp-ts/lib/pipeable"
import { MiteApiError } from "mite-api"
import { Moment } from "moment"
import { parse } from "../commands/commandParser"
import { doCheck, doRegister, doUnregister, Failures } from "../commands/commands"
import { Repository } from "../db/user-repository"
import { missingTimeEntriesBlock } from "./blocks"
import { createUserContext } from "./createUserContext"
import { sayHelp } from "./help"
import { Actions, openRegisterWithApiKeyModal, publishDefaultHomeTab, registerWithApiKeyModal } from "./home"
import { slackUserResolver } from "./slackUserResolver"

export type SlackApiUser = {
    user?: { profile?: { email?: string } }
} & WebAPICallResult

const displayRegisterResult = (say: SayFn) => either.fold(() => sayMissingApiKey(say), () => say("Success!"))

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

    switch (command.name) {
    case "check":
        await doCheck(context).then(result => displayCheckResult(say, result))
        break
    case "register":
        await doRegister(command, context, slackUserResolver(app))()
            .then(displayRegisterResult(say))
        break
    case "unregister":
        await doUnregister(context).then(() => displayUnregisterResult(say))
    }
})

export const setupHomeTabHandling: (app: App, repository: Repository) => void = (app, repository) => {
    app.event("app_home_opened", async ({ event }) => {
        if (event.tab !== "home") {
            return
        }

        publishDefaultHomeTab(app, event.user, repository)
    })
}

export const setupActionHandling: (app: App, repository: Repository) => void = (app, repository) => {
    app.action(Actions.Register, async ({ body, ack }) => {
        console.log("Register action received.")
        await ack()

        // FIXME if this throws because there is already an api key for the user, but it is mistyped, we throw and do not let the user register again
        const result = doRegister({ name: "register" }, createUserContext(repository, body.user.id), slackUserResolver(app))
        const task = pipe(
            result,
            taskEither.fold(
                () => () => openRegisterWithApiKeyModal(app, (body as BlockAction).trigger_id),
                () => () => publishDefaultHomeTab(app, body.user.id, repository)
            ))

        await task()
    })

    app.action(Actions.Unregister, async ({ body, ack }) => {
        console.log("Unregister action received.")
        await ack()

        await doUnregister(createUserContext(repository, body.user.id))
        publishDefaultHomeTab(app, body.user.id, repository)
    })

    app.action(Actions.Refresh, async ({ body, ack }) => {
        console.log("Refresh action received.")
        await ack()

        publishDefaultHomeTab(app, body.user.id, repository)
    })

    app.view(registerWithApiKeyModal.id, async ({ body, view, ack }) => {
        await ack()
        // TODO what if we cannot find the value?
        const miteApiKey: string = view.state.values[registerWithApiKeyModal.inputBlockId]?.[registerWithApiKeyModal.inputBlockActionId]?.value

        await repository.registerUserWithMiteApiKey(body.user.id, miteApiKey)
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

async function displayUnregisterResult(say: SayFn): Promise<void> {
    await say("Success!")
}

async function reportError(say: SayFn, error: Error | MiteApiError): Promise<void> {
    console.error("Failed to execute command because of ", error)
    const message = isMiteApiError(error) ? error.error : error.message
    await say(`Sorry, I couldn't to that because of: "${message}"`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMiteApiError(candidate: any): candidate is MiteApiError {
    return !!candidate.error
}

function sayMissingApiKey(say: SayFn){
    say("Sorry, I can't get your times by myself. Please register with your mite api key from https://leanovate.mite.yo.lk/myself and send `register <YOUR_MITE_API_KEY>`.")
        .catch(e => console.error("Failed to say something", e))
}
