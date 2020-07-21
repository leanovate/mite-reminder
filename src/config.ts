import { Timezone } from "tz-offset"

export type Config = {
    miteApiKey?: string
    slackToken: string
    slackSigningSecret: string
    miteAccountName: string
    dbPath: string
    timezone: Timezone
}

const getConfig = (): Config => {
    const miteApiKey = process.env.MITE_API_KEY
    const slackToken = process.env.SLACK_TOKEN
    const slackSigningSecret = process.env.SLACK_SIGNING_SECRET
    const dbPath = process.env.DB_PATH || "db.json"
    const timezone: Timezone = <Timezone>process.env.timezone || "Europe/Berlin"

    if (!slackToken) {
        throw new Error("SLACK_TOKEN environment variable not set. It is required to run the slack bot.")
    }
    if (!slackSigningSecret) {
        throw new Error("SLACK_SIGNING_SECRET environment variable not set. It is required to run the slack bot.")
    }
    const miteAccountName = process.env.MITE_ACCOUNT_NAME
    if (!miteAccountName) {
        throw new Error("MITE_ACCOUNT_NAME environment variable not set. It is required to run the slack bot.")
    }
    return {
        miteApiKey,
        slackToken,
        slackSigningSecret,
        miteAccountName,
        dbPath,
        timezone
    }
}

export default getConfig()