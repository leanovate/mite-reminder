import { taskEither as T } from "fp-ts"
import { pipe } from "fp-ts/lib/function"
import { TaskEither, taskEither } from "fp-ts/lib/TaskEither"
import moment, { Moment } from "moment"
import { ApiKeyIsMissing, AppError, IOError, UserIsUnknown } from "../app/errors"
import { orElseFailWith } from "../app/utils"
import { getMiteIdByEmail } from "../mite/miteApiWrapper"
import { getMissingTimeEntries, lastFortyDays } from "../mite/time"
import { isCheckContext, UserContext } from "../slack/userContext"
import { RegisterCommand } from "./commandParser"
import * as A from "fp-ts/lib/Array"
import { MiteApi } from "mite-api"

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

export const translateSlackUserToMiteId = (slackUserId: string, miteApi: MiteApi, getEmailFromSlackId: (slackId: string) => TaskEither<AppError, { email: string }>): TaskEither<AppError, number> => {
    return pipe(
        getEmailFromSlackId(slackUserId),
        T.chain(({ email }) => getMiteIdByEmail(miteApi, email)),
        T.chain(orElseFailWith(new UserIsUnknown(slackUserId))),
    )
}

export function doCheck(context: UserContext): TaskEither<AppError, Moment[]> {
    if (!isCheckContext(context)) {
        return T.left(new ApiKeyIsMissing(context.slackId))
    }

    const user = context.repository.loadUser(context.slackId)
    if (!user) {
        return T.left(new UserIsUnknown(context.slackId))
    }

    const miteId = user.miteId ?? "current"

    const { start, end } = lastFortyDays(moment())

    return getMissingTimeEntries(
        miteId,
        start,
        end,
        context.miteApi
    )
}

export const getMissingTimesForMiteId = (miteId: number, miteApi: MiteApi): TaskEither<AppError, Moment[]> => {
    const { start, end } = lastFortyDays(moment())

    return getMissingTimeEntries(
        miteId,
        start,
        end,
        miteApi
    )
}

export function doUnregister(context: UserContext): TaskEither<IOError, void> {
    return context.repository.unregisterUser(context.slackId)
}

export enum CheckUserResult {
    COMPLETED_ALL_ENTRIES,
    IS_MISSING_TIMES
}

export function doCheckUsers(context: UserContext, slackIds: string[], userResolver: (slackId: string) => TaskEither<AppError, { email: string; }>): TaskEither<AppError, CheckUsersReport> {
    if (!isCheckContext(context)) {
        return T.left(new ApiKeyIsMissing(context.slackId))
    }

    const checkTimesForUser = (slackId: string): T.TaskEither<AppError, { slackId: string; missingTimes: moment.Moment[] }> => pipe(
        translateSlackUserToMiteId(slackId, context.miteApi, userResolver),
        T.chain((miteId) => getMissingTimesForMiteId(miteId, context.miteApi)),
        T.map(missingTimes => ({ slackId, missingTimes }))
    )
    const reduceMissingTimesIntoReport = (results: { slackId: string; missingTimes: moment.Moment[] }[]): { [x: string]: CheckUserResult } => pipe(
        results,
        A.reduce({}, (report: CheckUsersReport, element: { slackId: string; missingTimes: moment.Moment[] }) => ({
            ...report,
            [element.slackId]: element.missingTimes.length > 0
                ? CheckUserResult.IS_MISSING_TIMES
                : CheckUserResult.COMPLETED_ALL_ENTRIES
        })))

    return pipe(
        slackIds,
        A.map(checkTimesForUser),
        A.sequence(taskEither),
        T.map(reduceMissingTimesIntoReport)
    )
}

export interface CheckUsersReport {
    [slackId: string]: CheckUserResult
}
