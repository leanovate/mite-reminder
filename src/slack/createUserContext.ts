import { Repository, User } from "../db/user-repository"
import config from "../config"
import { createMiteApi } from "../mite/miteApWrapper"
import { UserContext } from "./userContext"

export function createUserContextFromUser(repository: Repository, user: User): UserContext {
    const miteApiKey = user.miteApiKey ?? config.miteApiKey

    return {
        repository,
        slackId: user.slackId,
        miteApi: miteApiKey ? createMiteApi(miteApiKey, config.miteAccountName) : undefined,
        config
    }
}

export function createUserContextFromSlackId(repository: Repository, slackId: string): UserContext {
    const user = repository.loadUser(slackId)
    const miteApiKey = user?.miteApiKey ?? config.miteApiKey

    return {
        repository,
        slackId,
        miteApi: miteApiKey ? createMiteApi(miteApiKey, config.miteAccountName) : undefined,
        config
    }
}
