import { App } from "@slack/bolt"
import { KnownBlock } from "@slack/web-api"
import { doCheck, Failures } from "../commands/commands"
import config from "../config"
import { Repository } from "../db/user-repository"
import { missingTimeEntriesBlock } from "./blocks"
import { createUserContext } from "./createUserContext"
import moment from "moment"

export const publishDefaultHomeTab: (app: App, slackId: string, repository: Repository) => void = async (app, slackId, repository) => {
    const user = repository.loadUser(slackId)
    let blocks: KnownBlock[]

    if (user) {
        blocks = await buildMissingTimesBlocks(slackId, repository)
    } else {
        blocks = await buildRegisterBlocks()
    }

    app.client.views.publish({
        user_id: slackId,
        token: config.slackToken,
        view: {
            type: "home",
            blocks
        }
    })
}

export enum Actions {
    Register = "register",
    Unregister = "unregister",
    Refresh = "refresh"
}

const buildRegisterBlocks: () => Promise<KnownBlock[]> = async () => {
    return [
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    action_id: Actions.Register,
                    "text": {
                        "type": "plain_text",
                        "text": "Register"
                    },
                    "style": "primary",
                    "value": "Register"
                }
            ]
        },
        {
            type: "section",
            text: {
                type: "plain_text",
                text: "If you register you can check your missing mite entries and will receive reminders about them."
            }
        },
        {
            type: "section",
            text: {
                type: "plain_text",
                text: "Reminders will happen each friday morning and will include all days for the past seven days, automatically excluding holidays and weekends."
            }
        }
    ]
}

const buildMissingTimesBlocks: (slackId: string, repository: Repository) => Promise<KnownBlock[]> = async (slackId, repository) => {
    const result = await doCheck(createUserContext(repository, slackId))
    if (result === Failures.ApiKeyIsMissing || result === Failures.UserIsUnknown) {
        console.log("Please handle this error properly")
        return [{
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Failed to report missing times. Sorry -.-" // TODO
            }
        }]
    }

    return [
        {
            type: "actions",
            elements: [
                {
                    type: "button",
                    action_id: Actions.Refresh,
                    text: {
                        type: "plain_text",
                        text: "Refresh"
                    }
                },
                {
                    type: "button",
                    action_id: Actions.Unregister,
                    style: "danger",
                    text: {
                        type: "plain_text",
                        text: "Stop receiving notifications"
                    }
                }
            ]
        },
        ...missingTimeEntriesBlock(result).blocks,
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `_Update at: ${moment().format("LLL")}_`
            }
        }]
}