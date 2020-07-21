import miteApi, { MiteApi, MiteApiError, TimeEntries, Users } from "mite-api"
import { Moment } from "moment"

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

const getMiteIdByEmail = (mite: MiteApi, email: string): Promise<number | null> =>
    new Promise((resolve, reject) => mite.getUsers({ email }, (err, result) => err
        ? reject(<MiteApiError>result)
        : resolve((<Users>result)
            .map(user => user.user)
            .find(user => user.email === email)?.id)))



export { createMiteApi, getTimeEntries, getMiteIdByEmail }
