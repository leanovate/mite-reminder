import config from "../config"
import { createMiteApi } from "./mite-api-wrapper"

if (!config.miteApiKey) {
    throw new Error("mite api key not set") //TODO make this a non-requirement
}

const defaultMiteApi = createMiteApi(config.miteApiKey, config.miteAccountName)

export default defaultMiteApi
