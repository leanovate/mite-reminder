import { Repository } from "../db/user-repository"
import config from "../config"
import { createMiteApi } from "../mite/mite-api-wrapper"
import { UserContext } from "./userContext"

export function createUserContext(repository: Repository, slackId: string): UserContext {
    const user = repository.loadUser(slackId)
    const miteApiKey = user?.miteApiKey ?? config.miteApiKey

    return {
        repository,
        slackId,
        miteApi: miteApiKey ? createMiteApi(miteApiKey, config.miteAccountName) : undefined,
        config
    }
}
