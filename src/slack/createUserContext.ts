import { Failures } from "../commands/commands"
import { Repository } from "../db/user-repository"
import config from "../config"
import { createMiteApi } from "../mite/mite-api-wrapper"
import { UserContext } from "./userContext"

export function createUserContext(repository: Repository, slackId: string): UserContext {
    const user = repository.loadUser(slackId)
    const miteApiKey = user?.miteApiKey ?? config.miteApiKey
    if (!miteApiKey) {
        // TODO inform user that a mite api key needs to be provided
        throw new Error(Failures.ApiKeyIsMissing)
    }

    return {
        repository,
        slackId,
        miteApi: createMiteApi(miteApiKey, config.miteAccountName),
        config
    }
}
