import { App } from "@slack/bolt"
import { KnownBlock } from "@slack/web-api"
import config from "../config"
import { Repository } from "../db/user-repository"
import { doCheck, Failures } from "../commands/commands"
import { createUserContext } from "./createUserContext"
import { missingTimeEntriesBlock } from "./blocks"

export const publishDefaultHomeTab : (app: App, slackId: string, repository: Repository) => void =  async (app, slackId, repository) => {
    const user = repository.loadUser(slackId)

    if(user) {
        app.client.views.publish({
            user_id: slackId,
            token: config.slackToken,
            view: {
                
                type: "home",
                blocks: await buildMissingTimesView(slackId, repository)
            }
        })
    }
}

const buildMissingTimesView: (slackId: string, repository: Repository) => Promise<KnownBlock[]> = async (slackId, repository) => {
    const result = await doCheck(createUserContext(repository,slackId))
    if(result === Failures.ApiKeyIsMissing || result === Failures.UserIsUnknown) {
        console.log("Please handle this error properly")
        return [{
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Failed to report missing times. Sorry -.-" // TODO
            }
        }]
    }

    return [...missingTimeEntriesBlock(result).blocks, {
        type: "section",
        text: {
            type: "mrkdwn",
            text: `_Update at: ${new Date().toISOString()}_`
        }
    }]
}