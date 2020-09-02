import { DividerBlock, KnownBlock, SectionBlock } from "@slack/web-api"
import { Moment } from "moment"
import { CheckUserResult, CheckUsersReport } from "../commands/commands"
import config from "../config"
import { formatTimeReadable } from "../mite/time"

const divider: DividerBlock = {
    type: "divider"
}

const emptyTimesBlock: KnownBlock = {
    type: "section",
    text: {
        type: "plain_text",
        emoji: true,
        text: "You have completed all your time entries :ok_hand:"
    }
}

export const userReportEntriesBlock = (report: CheckUsersReport): { text: string, blocks: KnownBlock[] } => {
    const usersWithMissingEntries = Object.keys(report)
        .filter(key => report[key] == CheckUserResult.IS_MISSING_TIMES)
        .map(userId => `@${userId}`)

    const usersWithCompletedTimes = Object.keys(report)
        .filter(key => report[key] == CheckUserResult.COMPLETED_ALL_ENTRIES)
        .map(userId => `@${userId}`)

    const usersWithMissingTimesBlock: SectionBlock = {
        type: "section",
        text: {
            type: "mrkdwn",
            text: `:chart_with_downwards_trend: Following Users have missing time entries: ${usersWithMissingEntries.join(", ")}`
        }
    }
    const usersWithCompletedTimesBlock: SectionBlock = {
        type: "section",
        text: {
            type: "mrkdwn",
            text: `:chart_with_updwards_trend: Following Users have tracked all times: ${usersWithCompletedTimes.join(", ")}`
        }
    }

    return {
        text: `There are ${usersWithMissingEntries.length} users with missing entries.`,
        blocks: [
            usersWithMissingTimesBlock,
            divider,
            usersWithCompletedTimesBlock
        ]
    }
}

export const missingTimeEntriesBlock = (times: Moment[]): { text: string, blocks: KnownBlock[] } => {
    if (times.length === 0) {
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
