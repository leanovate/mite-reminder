import { createMiteApi, getMiteIdByEmail } from "./mite/mite-api-wrapper"
import config from "./config"

if (!config.miteApiKey) {
    throw new Error("mite api key not set")
}
// const result = getTimeEntries(createMiteApi(config.miteApiKey), "current", moment().subtract(10, "days"), moment())

const result = getMiteIdByEmail(createMiteApi(config.miteApiKey, config.miteAccountName), "moritz.rumpf@leanovate.de")

const start = async () => {
    try {
        console.log(await result)

    } catch (e) {
        console.error("got error: ", e)
    }
}
start()