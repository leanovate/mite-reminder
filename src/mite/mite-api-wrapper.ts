import miteApi, { MiteApi, MiteApiError, TimeEntries, Users } from "mite-api"
import { Moment } from "moment"
import config from "../config"

const createMiteApi: (apiKey: string) => MiteApi = (apiKey: string) => miteApi({
    account: config.miteAccountName,
    apiKey: apiKey,
    applicationName: "mite-reminder"
})

async function getTimeEntries(mite: MiteApi, userId: string | "current", from: Moment, to: Moment): Promise<TimeEntries> {
    return new Promise((resolve, reject) => mite.getTimeEntries({
        from: from.format("YYYY-MM-DD"),
        to: to.format("YYYY-MM-DD"),
        user_id: userId
    }, (err, result) => err
        ? reject(<MiteApiError>result)
        : resolve(<TimeEntries>result)))
}

const getUser = (mite: MiteApi, userId: string): Promise<Users> =>
    new Promise((resolve, reject) => mite.getUser(userId, (err, result) => err
        ? reject(<MiteApiError>result)
        : resolve(<Users>result)))

export { createMiteApi, getTimeEntries, getUser }
