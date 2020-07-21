import moment, { Moment } from "moment"
import { getMiteIdByEmail } from "../mite/mite-api-wrapper"
import { getMissingTimeEntries } from "../mite/time"
import { isCheckContext, UserContext } from "../slack/userContext"
import { RegisterCommand } from "./commandParser"

export type SlackUser = {
    slackId: string
}

export enum Failures {
    ApiKeyIsMissing = "User is known but no app wide admin-api key is specified.",
    UserIsUnknown = "User is unknown and needs to register with his/her own api key."
}

export async function doRegister(command: RegisterCommand, context: UserContext, emailResolver: (slackId: string) => Promise<{email: string | undefined}>): Promise<void | Failures> {
    if(command.miteApiKey) {
        return context.repository.registerUserWithMiteApiKey(context.slackId, command.miteApiKey)
    }

    if(!isCheckContext(context)) {
        // If the user registers without an API key, we need a global admin key instead to we can call mite
        return Failures.ApiKeyIsMissing
    }

    const {email} = await emailResolver(context.slackId)

    if(!email) {
        console.warn("Failed to lookup email address with slack id", context.slackId)
        return Failures.UserIsUnknown
    }

    const miteId = await getMiteIdByEmail(context.miteApi, email)

    if(!miteId) {
        console.warn("Failed to look up mite id with email", email)
        return Failures.UserIsUnknown
    }

    return context.repository.registerUserWithMiteId(context.slackId, miteId)
}

export async function doCheck(context: UserContext): Promise<Moment[] | Failures> {
    if(!isCheckContext(context)) {
        return Failures.ApiKeyIsMissing
    }

    const user = context.repository.loadUser(context.slackId) 
    if(!user) {
        return Failures.UserIsUnknown
    }

    const miteId = user.miteId ?? "current" 

    return getMissingTimeEntries(
        miteId,
        moment().subtract(40, "day"),
        moment(),
        context.miteApi
    )
}

export async function doUnregister(context: UserContext): Promise<void> {
    return context.repository.unregisterUser(context.slackId)
}