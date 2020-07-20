import { Failures } from "../commands/commands"
import { CheckContext } from "../slack/userContext"
import { getMiteIdByEmail } from "./mite-api-wrapper"

export async function getMiteId(context: CheckContext): Promise<number | "current" | Failures.UserIsUnknown> {
    let miteId: number | "current"

    const user = context.repository.loadUser(context.slackId)

    if (user?.miteApiKey) {
        miteId = "current"
    }
    else {
        const mId = await getMiteIdByEmail(context.miteApi, context.slackId) // FIXME This should be an email
        if (!mId) {
            return Failures.UserIsUnknown
        }
        miteId = mId
    }

    return miteId
}
