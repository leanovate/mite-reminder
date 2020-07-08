import { getTimeEntries, createMiteApi } from "./mite/mite-api-wrapper"
import moment from "moment"
import config from "./config"

if (!config.miteApiKey) {
    throw new Error("mite api key not set")
}
const result = getTimeEntries(createMiteApi(config.miteApiKey), "current", moment().subtract(10, "days"), moment())

const start = async () => console.log(await result)
start()