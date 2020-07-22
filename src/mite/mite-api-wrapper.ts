import miteApi, { MiteApi, MiteApiError, TimeEntries, Users } from "mite-api"
import { Moment } from "moment"
import { Either, left, right, toError } from "fp-ts/lib/Either"
import { Option, fromNullable, tryCatch } from "fp-ts/lib/Option"
import { either, taskEither } from "fp-ts"
import { TaskEither } from "fp-ts/lib/TaskEither"

const createMiteApi: (apiKey: string, miteAccountName: string) => MiteApi = (apiKey, miteAccountName) => miteApi({
    account: miteAccountName,
    apiKey: apiKey,
    applicationName: "mite-reminder"
})

async function getTimeEntries(mite: MiteApi, userId: number | "current", from: Moment, to: Moment): Promise<TimeEntries> {
    return new Promise((resolve, reject) => mite.getTimeEntries({
        from: from.format("YYYY-MM-DD"),
        to: to.format("YYYY-MM-DD"),
        user_id: userId
    }, (err, result) => err
        ? reject(<MiteApiError>result)
        : resolve(<TimeEntries>result)))
}

const getMiteIdByEmail = (mite: MiteApi, email: string): TaskEither<Error, Option<number>> => { 
    const p: Promise<Option<number>> =  new Promise((resolve, reject) => mite.getUsers({ email }, (err, result) => err
        ? reject(new Error((<MiteApiError>result).error))
        : resolve(
            fromNullable(
                    (<Users>result)
                        .map(user => user.user)
                        .find(user => user.email === email)?.id
            )
        )
    ))

    return taskEither.tryCatch(
        () => p,
        either.toError
    )
}

export { createMiteApi, getTimeEntries, getMiteIdByEmail }
