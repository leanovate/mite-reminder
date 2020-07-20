import { UserContext } from "../slack/events"
import { Failures } from "../commands/commands"

export async function getMiteId(context: UserContext): Promise<number | "current" | Failures.UserIsUnknown> {
    let miteId: number | "current"

    const user = context.repository.loadUser(context.slackId)

    if (user?.miteApiKey) {
        miteId = "current"
    }
    else {
        const mId = await context.repository.getMiteId(context.slackId)
        if (!mId) {
            return Failures.UserIsUnknown
        }
        miteId = mId
    }

    return miteId
}
