import { either as E, task as T, taskEither as Te } from "fp-ts"
import * as A from "fp-ts/lib/Array"
import { pipe } from "fp-ts/lib/function"
import { task } from "fp-ts/lib/Task"
import { TaskEither } from "fp-ts/lib/TaskEither"
import { MiteApi } from "mite-api"
import moment, { Moment } from "moment"
import { ApiKeyIsMissing, AppError, IOError, UserIsUnknown } from "../app/errors"
import { orElseFailWith } from "../app/utils"
import { getMiteIdByEmail } from "../mite/miteApiWrapper"
import { getMissingTimeEntries, lastFortyDays, lastWeekThursdayToThursday } from "../mite/time"
import { isCheckContext, UserContext } from "../slack/userContext"
import { RegisterCommand } from "./commandParser"

export function doRegister(command: RegisterCommand, context: UserContext, getEmailFromSlackId: (slackId: string) => TaskEither<AppError, { email: string }>): TaskEither<AppError, void> {
    if (command.miteApiKey) {
        return context.repository.registerUserWithMiteApiKey(context.slackId, command.miteApiKey)
    }

    if (!isCheckContext(context)) {
        // If the user registers without an API key, we need a global admin key instead to we can call mite
        return Te.left(new ApiKeyIsMissing(context.slackId))
    }

    return pipe(
        getEmailFromSlackId(context.slackId),
        Te.chain(result => getMiteIdByEmail(context.miteApi, result.email)),
        Te.chain(orElseFailWith(new UserIsUnknown(context.slackId))),
        Te.chain(miteId => context.repository.registerUserWithMiteId(context.slackId, miteId))
    )
}

export const translateSlackUserToMiteId = (slackUserId: string, miteApi: MiteApi, getEmailFromSlackId: (slackId: string) => TaskEither<AppError, { email: string }>): TaskEither<AppError, number> => {
    return pipe(
        getEmailFromSlackId(slackUserId),
        Te.chain(({ email }) => getMiteIdByEmail(miteApi, email)),
        Te.chain(orElseFailWith(new UserIsUnknown(slackUserId))),
    )
}

export function doCheck(context: UserContext): TaskEither<AppError, Moment[]> {
    if (!isCheckContext(context)) {
        return Te.left(new ApiKeyIsMissing(context.slackId))
    }

    const user = context.repository.loadUser(context.slackId)
    if (!user) {
        return Te.left(new UserIsUnknown(context.slackId))
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
    const { start, end } = lastWeekThursdayToThursday(moment())

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
        return Te.left(new ApiKeyIsMissing(context.slackId))
    }

    type UserTimes = {
        slackId: string
        missingTimes: moment.Moment[]
    }

    const checkTimesForUser = (slackId: string): Te.TaskEither<AppError, UserTimes> => pipe(
        translateSlackUserToMiteId(slackId, context.miteApi, userResolver),
        Te.chain(miteId => getMissingTimesForMiteId(miteId, context.miteApi)),
        Te.map(missingTimes => ({ slackId, missingTimes }))
    )
    const reduceMissingTimesIntoReport = (results: UserTimes[]): { [x: string]: CheckUserResult } => pipe(
        results,
        A.reduce({}, (report: CheckUsersReport, element: UserTimes) => ({
            ...report,
            [element.slackId]: element.missingTimes.length > 0
                ? CheckUserResult.IS_MISSING_TIMES
                : CheckUserResult.COMPLETED_ALL_ENTRIES
        })))

    return pipe(
        slackIds,
        A.map(checkTimesForUser),
        A.sequence(task),
        T.map(A.rights),
        T.map(reduceMissingTimesIntoReport),
        T.map(E.right)
    )
}

export interface CheckUsersReport {
    [slackId: string]: CheckUserResult
}
