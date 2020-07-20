import { UserContext } from "../slack/events"
import { Failures } from "../commands/commands"
import { getMiteIdByEmail } from "./mite-api-wrapper"

export async function getMiteId(context: UserContext): Promise<number | "current" | Failures.UserIsUnknown> {
    let miteId: number | "current"

    const user = context.repository.loadUser(context.slackId)

    if (user?.miteApiKey) {
        miteId = "current"
    }
    else {
        const mId = await getMiteIdByEmail(context.miteApi, context.slackId)
        if (!mId) {
            return Failures.UserIsUnknown
        }
        miteId = mId
    }

    return miteId
}
