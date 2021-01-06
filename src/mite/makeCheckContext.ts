import { either } from "fp-ts"
import { Either } from "fp-ts/lib/Either"
import { ApiKeyIsMissing, AppError, UserIsUnknown } from "../app/errors"
import { CheckContext, isCheckContext, UserContext } from "../slack/userContext"

export function makeCheckContext(context: UserContext): Either<AppError, CheckContext> {
    console.log('entering makeCheckContext')
    if (!isCheckContext(context)) {
        return either.left(new ApiKeyIsMissing(context.slackId))
    }
    const user = context.repository.loadUser(context.slackId)
    if (!user) {
        return either.left(new UserIsUnknown(context.slackId))
    }

    console.log('leaving makeCheckContext')
    return either.right({
        ...context,
        miteUserId: user?.miteId ?? "current"
    })
}