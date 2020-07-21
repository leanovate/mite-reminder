import { Moment } from "moment"
import { SayArguments } from "@slack/bolt"

export const missingTimeEntriesBlock = (times: Moment[]): Pick<SayArguments, "blocks" | "text">  =>  {
    const header = {
        type: "section",
        text: {
            "type": "mrkdwn",
            "text": ":clock1: Your time entries for the following dates are _missing_ or contain _0 minutes_:"
        }
    }
    
    const divider = {
        type: "divider"
    }

    const timeBlock = {
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