import miteApi, { MiteApi, MiteApiError, TimeEntries, Users } from "mite-api"
import { Moment } from "moment"
import { Either, left, right } from "fp-ts/lib/Either"
import { Option, fromNullable } from "fp-ts/lib/Option"

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

const getMiteIdByEmail = (mite: MiteApi, email: string): Promise<Either<MiteApiError, Option<number>>> => 
    new Promise(resolve => mite.getUsers({ email }, (err, result) => err
        ? resolve(left(<MiteApiError>result))
        : resolve(
            right(
                fromNullable(
                    (<Users>result)
                        .map(user => user.user)
                        .find(user => user.email === email)?.id
                )
            )
        )
    ))


export { createMiteApi, getTimeEntries, getMiteIdByEmail }
