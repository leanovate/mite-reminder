import { getTimeEntries, createMiteApi } from "./mite/mite-api-wrapper"
import moment from "moment"
import config from "./config"
import { Repository } from "./db/user-repository"

if (!config.miteApiKey) {
    throw new Error("mite api key not set")
}
// const result = getTimeEntries(createMiteApi(config.miteApiKey), "current", moment().subtract(10, "days"), moment())

const result = new Repository({}, "users.json", createMiteApi(config.miteApiKey)).getMiteId("moritz.rumpf@leanovate.de")

const start = async () => {
    try {
        console.log(await result)

    } catch (e) {
        console.error("got error: ", e)
    }
}
start()