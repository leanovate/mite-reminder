export type Config = {
    miteApiKey?: string
    slackToken: string
    slackSigningSecret: string
    useMiteAdminKey: boolean
    miteAccountName: string
    dbPath: string
}

const getConfig = (): Config => {
    const miteApiKey = process.env.MITE_API_KEY
    const useMiteAdminKey = process.env.IS_MITE_API_KEY_ADMIN === "yes"
    const slackToken = process.env.SLACK_TOKEN
    const slackSigningSecret = process.env.SLACK_SIGNING_SECRET
    const dbPath = process.env.DB_PATH || "db.json"

    if (useMiteAdminKey && !miteApiKey) { // useMiteAdminKey is probably redundant, could be just !!MITE_API_KEY
        throw new Error("Bot should use the admin api key (IS_MITE_API_KEY_ADMIN=='yes') but no MITE_API_KEY is set!")
    }
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
        useMiteAdminKey,
        miteAccountName,
        dbPath
    }
}

export default getConfig()