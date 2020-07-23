import { App } from "@slack/bolt"
import { KnownBlock, View } from "@slack/web-api"
import moment from "moment"
import { doCheck, Failures } from "../commands/commands"
import config from "../config"
import { Repository } from "../db/user-repository"
import { missingTimeEntriesBlock } from "./blocks"
import { createUserContext } from "./createUserContext"

export const publishDefaultHomeTab: (app: App, slackId: string, repository: Repository) => Promise<void> = async (app, slackId, repository) => {
    const user = repository.loadUser(slackId)
    let blocks: KnownBlock[]

    if (user) {
        // FIXME this can throw but we do not catch it
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
    Refresh = "refresh",
}

async function buildRegisterBlocks(): Promise<KnownBlock[]> {
    return [
        {
            "type": "actions",
            "elements": [
                {
                    type: "button",
                    action_id: Actions.Register,
                    text: {
                        type: "plain_text",
                        text: "Start using mite reminder"
                    },
                    style: "primary"
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

async function buildMissingTimesBlocks(slackId: string, repository: Repository): Promise<KnownBlock[]> {
    const result = await doCheck(createUserContext(repository, slackId))
    if (result === Failures.ApiKeyIsMissing || result === Failures.UserIsUnknown) {
        console.log("Please handle this error properly") // FIXME
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

export const registerWithApiKeyModal = {
    id: "registerWithApiKeyModal",
    inputBlockId: "miteApiKeyInputBlockId",
    inputBlockActionId: "miteApiKeyInputActionId"
}
export const registerWithApiKeyModalView: View = {
    callback_id: registerWithApiKeyModal.id,
    title: {
        type: "plain_text",
        text: "Register"
    },
    submit: {
        type: "plain_text",
        text: "Register"
    },
    blocks: [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Sorry, I can't find your mite account. Please register with your mite api key from https://leanovate.mite.yo.lk/myself"
            }
        },
        {
            type: "input",
            block_id: registerWithApiKeyModal.inputBlockId,
            element: {
                type: "plain_text_input",
                placeholder: {
                    type: "plain_text",
                    text: "mite api key"
                },
                action_id: registerWithApiKeyModal.inputBlockActionId
            },
            label: {
                type: "plain_text",
                text: "Enter your mite api key"
            }
        }
    ],
    type: "modal"
}

export async function openRegisterWithApiKeyModal(app: App, triggerId: string): Promise<void> {
    await app.client.views.open({
        token: config.slackToken,
        trigger_id: triggerId,
        view: registerWithApiKeyModalView
    })
}

