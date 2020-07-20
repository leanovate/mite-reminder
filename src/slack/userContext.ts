import { Repository } from "../db/user-repository"
import { Config } from "../config"
import { MiteApi } from "mite-api"

export interface UserContext {
    repository: Repository
    slackId: string
    miteApi: MiteApi
    config: Config
}
