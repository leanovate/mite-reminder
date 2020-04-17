const getConfig = () => {
    const miteApiKey = process.env.MITE_API_KEY
    const useMiteAdminKey = process.env.IS_MITE_API_KEY_ADMIN === "yes"
    const slackToken = process.env.SLACK_TOKEN
    const timezone = process.env.TIMEZONE
    if (useMiteAdminKey && !miteApiKey) {
        throw new Error("Bot should use the admin api key (IS_MITE_API_KEY_ADMIN=='yes') but no MITE_API_KEY is set!")
    }
    if (!slackToken) {
        throw new Error("SLACK_TOKEN environment variable not set. It is required to run the slack bot.")
    }
    return {
        miteApiKey,
        slackToken,
        useMiteAdminKey,
        timezone
    }
}

module.exports = {
    getConfig
}