import { DividerBlock, KnownBlock, SectionBlock } from "@slack/web-api"
import { Moment } from "moment"
import config from "../config"
import { formatTimeReadable } from "../mite/time"

const emptyTimesBlock: KnownBlock = {
    type: "section",
    text: {
        type: "plain_text",
        emoji: true,
        text: "You have completed all your time entries :ok_hand:"
    }
}

export const missingTimeEntriesBlock = (times: Moment[]): {text: string, blocks: KnownBlock[]}  =>  {
    if(times.length === 0) {
        return {
            text: "You have completed all your time entries",
            blocks: [emptyTimesBlock]
        }
    }

    const header: SectionBlock = {
        type: "section",
        text: {
            "type": "mrkdwn",
            "text": ":clock1: Your time entries for the following dates are _missing_ or contain _0 minutes_:"
        }
    }

    const divider: DividerBlock = {
        type: "divider"
    }

    const timeBlock: SectionBlock = {
        type: "section",
        text: {
            type: "mrkdwn",
            text: times.map(time => `• <https://${config.miteAccountName}.mite.yo.lk/#${time.format("YYYY/MM/DD")}|*${formatTimeReadable(time)}*>`).join("\n")
        }
    }    
    
    return {
        text: `You are missing time entries for ${times.length} days.`,
        blocks: [
            header,
            divider,
            timeBlock
        ]
    } 
}
