import { DividerBlock, KnownBlock, SectionBlock } from "@slack/web-api"
import { Moment } from "moment"

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
            text: times.map(time => `• <https://leanovate.mite.yo.lk/#${time.format("YYYY/MM/DD")}|*${time.format("DD.MM.YYYY")}*>`).join("\n") // TODO Replace "leanovate" with the value from config
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
