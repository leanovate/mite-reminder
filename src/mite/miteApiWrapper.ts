import { taskEither } from "fp-ts"
import { fromNullable, Option } from "fp-ts/lib/Option"
import { pipe } from "fp-ts/lib/pipeable"
import { TaskEither } from "fp-ts/lib/TaskEither"
import miteApi, { MiteApi, TimeEntries } from "mite-api"
import { Moment } from "moment"
import { AppError, UnknownAppError } from "../app/errors"

const createMiteApi: (apiKey: string, miteAccountName: string) => MiteApi = (apiKey, miteAccountName) => miteApi({
    account: miteAccountName,
    apiKey: apiKey,
    applicationName: `${miteAccountName}-mite-reminder`
})

function getTimeEntries(mite: MiteApi, userId: number | "current", from: Moment, to: Moment): TaskEither<AppError, TimeEntries> {
    const params = {
        from: from.format("YYYY-MM-DD"),
        to: to.format("YYYY-MM-DD"),
        user_id: userId
    }

    return pipe(
        taskEither.taskify(mite.getTimeEntries)(params),
        taskEither.mapLeft(error => new UnknownAppError(error))
    )
}

const getMiteIdByEmail = (mite: MiteApi, email: string): TaskEither<AppError, Option<number>> => pipe(
    taskEither.taskify(mite.getUsers)({ email }),
    taskEither.mapLeft(error => new UnknownAppError(error)),
    taskEither.map(users => fromNullable(users
        .map(user => user.user)
        .find(user => user.email === email)?.id)
    ))


export { createMiteApi, getTimeEntries, getMiteIdByEmail }
