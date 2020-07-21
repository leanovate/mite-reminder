import { DividerBlock, KnownBlock, SectionBlock } from "@slack/web-api"
import { Moment } from "moment"

export const missingTimeEntriesBlock = (times: Moment[]): {text: string, blocks: KnownBlock[]}  =>  {
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
            text: times.map(time => `• <https://leanovate.mite.yo.lk/#${time.format("YYYY/MM/DD")}|*${time.format("DD.MM.YYYY")}*>`).join("\n")
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