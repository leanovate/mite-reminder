import { Repository } from "../db/userRepository"
import { Config } from "../config"
import { MiteApi } from "mite-api"

export interface UserContext {
    repository: Repository
    slackId: string
    miteApi?: MiteApi
    config: Config
}

export type CheckContext = Required<UserContext>

export function isCheckContext(context: UserContext) : context is CheckContext {
    return !!context.miteApi
}