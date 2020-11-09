import { App, BlockAction, SayFn } from "@slack/bolt"
import { WebAPICallResult } from "@slack/web-api"
import { taskEither } from "fp-ts"
import { pipe } from "fp-ts/lib/pipeable"
import { Task } from "fp-ts/lib/Task"
import { google } from "googleapis"
import { MiteApiError } from "mite-api"
import moment from "moment"
import { AppError } from "../app/errors"
import { showProjects } from "../calendarSync/showProjects"
import { addCalendarEntriesToMite } from "../calendarSync/syncFromCalendar"
import { parse } from "../commands/commandParser"
import { doCheck, doCheckUsers, doRegister, doUnregister } from "../commands/commands"
import config from "../config"
import { Repository } from "../db/userRepository"
import { makeCheckContext } from "../mite/makeCheckContext"
import { addedCalendarEntriesBlock, missingTimeEntriesBlock, projectsAndServicesBlock, userReportEntriesBlock } from "./blocks"
import { getAllUsersFromChannel } from "./channels"
import { createUserContextFromSlackId, createRestrictedUserContext } from "./createUserContext"
import { sayHelp } from "./help"
import { Actions, openRegisterWithApiKeyModal, publishDefaultHomeTab, registerWithApiKeyModal } from "./home"
import { slackUserResolver } from "./slackUserResolver"

export type SlackApiUser = {
    user?: { profile?: { email?: string } }
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

    const context = createUserContextFromSlackId(repository, message.user)
    const restrictedUserContext = createRestrictedUserContext(repository, message.user)
    const command = parserResult.value

    switch (command.name) {
    case "check":
        // TODO display the user the check time range (1 week)
        await pipe(
            doCheck(context),
            taskEither.fold(
                e => reportError(say, e),
                result => async () => { await say(missingTimeEntriesBlock(result)) })
        )()
        break
    case "check channel":
        // TODO give a special error message when there is no mite api key for the user, like:
        //  "You need to supply your own admin key to use the functionality"
        await pipe(
            getAllUsersFromChannel(app, command.channelName),
            taskEither.chain(userList => doCheckUsers(restrictedUserContext, userList, slackUserResolver(app))),
            taskEither.map(userReportEntriesBlock),
            taskEither.fold(
                e => reportError(say, e),
                result => async () => { await say(result) }
            )
        )()
        break
    case "sync":
        await pipe(
            slackUserResolver(app)(context.slackId),
            taskEither.chain(userEmail => addCalendarEntriesToMite(context, google, userEmail.email, moment())),
            taskEither.map(addedCalendarEntriesBlock),
            taskEither.fold(
                e => reportError(say, e),
                result => async () => { await say(result) }
            )
        )()
        break
    case "show projects":
        await pipe(
            makeCheckContext(context),
            taskEither.fromEither,
            taskEither.chain(context => showProjects(context, command.searchString)),
            taskEither.map(projectsAndServicesBlock),
            taskEither.fold(
                e => reportError(say, e),
                result => async () => { await say(result) }
            )
        )()
        break
    case "register":
        await pipe(
            doRegister(command, context, slackUserResolver(app)),
            taskEither.fold(
                () => async () => sayMissingApiKey(say),
                () => async () => { await say("Success!") }
            )
        )()
        break
    case "unregister":
        await doUnregister(context)()
            .then(() => displayUnregisterResult(say))
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

        const result = doRegister({ name: "register" }, createUserContextFromSlackId(repository, body.user.id), slackUserResolver(app))
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

        await doUnregister(createUserContextFromSlackId(repository, body.user.id))()
        publishDefaultHomeTab(app, body.user.id, repository)
    })

    app.action(Actions.Refresh, async ({ body, ack }) => {
        console.log("Refresh action received.")
        await ack()

        publishDefaultHomeTab(app, body.user.id, repository)
    })

    app.view(registerWithApiKeyModal.id, async ({ body, view, ack }) => {
        await ack()
        const miteApiKey: string | undefined = view.state.values[registerWithApiKeyModal.inputBlockId]?.[registerWithApiKeyModal.inputBlockActionId]?.value

        if (miteApiKey === undefined) {
            throw new Error("mite-reminder did expect a form value but was unable to find one.")
        }

        await repository.registerUserWithMiteApiKey(body.user.id, miteApiKey)()
        publishDefaultHomeTab(app, body.user.id, repository)
    })
}

async function displayUnregisterResult(say: SayFn): Promise<void> {
    await say("Success!")
}

function reportError(say: SayFn, error: AppError): Task<void> {
    console.error("Failed to execute command because of ", error)
    const message = isMiteApiError(error) ? error.error : error.presentableMessage
    return () => say(`Sorry, I couldn't to that because of: "${message}"`).then(undefined)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMiteApiError(candidate: any): candidate is MiteApiError {
    return !!candidate.error
}

async function sayMissingApiKey(say: SayFn) {
    await say(`Sorry, I can't get your times by myself. Please register with your mite api key from https://${config.miteAccountName}.mite.yo.lk/myself and send \`register <YOUR_MITE_API_KEY>\`.`)
}
