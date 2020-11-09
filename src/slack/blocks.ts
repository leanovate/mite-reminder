import { DividerBlock, KnownBlock, SectionBlock } from "@slack/web-api"
import { TimeEntry } from "mite-api"
import { Moment } from "moment"
import { ShowProjectsResult } from "../calendarSync/showProjects"
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
    const convertIdToLink = (userId: string): string => `<@${userId}>`
    const usersWithMissingEntries = Object.keys(report)
        .filter(key => report[key] == CheckUserResult.IS_MISSING_TIMES)
        .map(convertIdToLink)

    const usersWithCompletedTimes = Object.keys(report)
        .filter(key => report[key] == CheckUserResult.COMPLETED_ALL_ENTRIES)
        .map(convertIdToLink)

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
            text: `:chart_with_upwards_trend: Following Users have tracked all times: ${usersWithCompletedTimes.join(", ")}`
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

export const addedCalendarEntriesBlock = (entriesAdded: TimeEntry[]): { text: string, blocks: KnownBlock[] } => {
    if (entriesAdded.length === 0) {
        return {
            text: "I didn't find any new meetings I could sync to mite.",
            blocks: [{
                type: "section",
                text: {
                    type: "plain_text",
                    emoji: true,
                    text: "I didn't find any new meetings I could sync to mite."
                }
            }]
        }
    }

    const header: SectionBlock = {
        type: "section",
        text: {
            "type": "mrkdwn",
            "text": ":calendar: I synced the following calendar entries to mite:"
        }
    }

    const entryBlock: SectionBlock = {
        type: "section",
        text: {
            type: "mrkdwn",
            text: entriesAdded.map(entry => `• ${entry.note} - ${entry.date_at}`).join("\n")
        }
    }

    return {
        text: `I synced ${entriesAdded.length} calendar entries to mite.`,
        blocks: [
            header,
            divider,
            entryBlock
        ]
    }
}

export const projectsAndServicesBlock = (projectsAndServices: ShowProjectsResult): { text: string, blocks: KnownBlock[] } => {
    const { projects, services } = projectsAndServices
    const projectsHeader: SectionBlock = {
        type: "section",
        text: {
            "type": "mrkdwn",
            "text": "Projects:"
        }
    }
    const servicesHeader: SectionBlock = {
        type: "section",
        text: {
            "type": "mrkdwn",
            "text": "Services:"
        }
    }

    const projectsBlock: SectionBlock = {
        type: "section",
        text: {
            type: "mrkdwn",
            text: projects.length > 0
                ? projects.map(project => `• ${project.name} - ${project.projectId}`).join("\n")
                : "No projects found."
        }
    }
    const servicesBlock: SectionBlock = {
        type: "section",
        text: {
            type: "mrkdwn",
            text: services.length > 0
                ? services.map(service => `• ${service.name} - ${service.serviceId}`).join("\n")
                : "No services found."
        }
    }

    return {
        text: `I have found ${projects.length} projects and ${services.length} services.`,
        blocks: [
            projectsHeader,
            projectsBlock,
            divider,
            servicesHeader,
            servicesBlock
        ]
    }
}