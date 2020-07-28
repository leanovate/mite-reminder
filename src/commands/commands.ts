import { taskEither as T } from "fp-ts"
import { pipe } from "fp-ts/lib/function"
import { TaskEither } from "fp-ts/lib/TaskEither"
import moment, { Moment } from "moment"
import { ApiKeyIsMissing, AppError, UserIsUnknown, IOError } from "../app/errors"
import { orElseFailWith } from "../app/utils"
import { getMiteIdByEmail } from "../mite/miteApWrapper"
import { getMissingTimeEntries } from "../mite/time"
import { isCheckContext, UserContext } from "../slack/userContext"
import { RegisterCommand } from "./commandParser"

export function doRegister(command: RegisterCommand, context: UserContext, getEmailFromSlackId: (slackId: string) => TaskEither<AppError, { email: string }>): TaskEither<AppError, void> {
    if (command.miteApiKey) {
        return context.repository.registerUserWithMiteApiKey(context.slackId, command.miteApiKey)
    }

    if (!isCheckContext(context)) {
        // If the user registers without an API key, we need a global admin key instead to we can call mite
        return T.left(new ApiKeyIsMissing(context.slackId))
    }    

    return pipe(
        getEmailFromSlackId(context.slackId),
        T.chain(result => getMiteIdByEmail(context.miteApi, result.email)),
        T.chain(orElseFailWith(new UserIsUnknown(context.slackId))),
        T.chain(miteId => context.repository.registerUserWithMiteId(context.slackId, miteId))
    )
}

export function doCheck(context: UserContext): TaskEither<AppError,Moment[]> {
    if (!isCheckContext(context)) {
        return T.left(new ApiKeyIsMissing(context.slackId))
    }

    const user = context.repository.loadUser(context.slackId)
    if (!user) {
        return T.left(new UserIsUnknown(context.slackId))
    }

    const miteId = user.miteId ?? "current"

    return getMissingTimeEntries(
        miteId,
        moment().subtract(40, "day"),
        moment(),
        context.miteApi
    )
}

export function doUnregister(context: UserContext): TaskEither<IOError, void> {
    return context.repository.unregisterUser(context.slackId)
}