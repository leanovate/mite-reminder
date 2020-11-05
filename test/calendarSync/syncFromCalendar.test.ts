import { either } from "fp-ts"
import { calendar_v3 } from "googleapis"
import { AddTimeEntryOptions, TimeEntries, TimeEntry } from "mite-api"
import { containsMiteEntry, toMiteEntry } from "../../src/calendarSync/syncFromCalendar"

describe("syncFromCalendar", () => {
    describe("toMiteEntry", () => {
        it("should convert a calendar entry to a mite entry", () => {
            const projectId = 1111
            const serviceId = 4444
            
            const calendarEntry: calendar_v3.Schema$Event = {
                summary: "CoP-DEV",
                description: `This is just for the mite matching: #mite ${projectId}/${serviceId} <br /> talking about dev stuff, link to hangout <a href="https://meet.google.com/4711">here</a>`,
                start: { dateTime: "2019-10-12T07:00:00Z" },
                end: { dateTime: "2019-10-12T07:45:00Z" }
            }
            const result = toMiteEntry(calendarEntry)

            expect(result).toEqual(either.right({
                date_at: "2019-10-12", 
                minutes: 45, 
                note: "CoP-DEV", 
                project_id: projectId, 
                service_id: serviceId
            }))
        })

        it("should return an error when no '#mite'-information was given in description", () => {
            const calendarEntry: calendar_v3.Schema$Event = {
                summary: "CoP-DEV",
                description: "mite should not parse this event",
                start: { dateTime: "2019-10-12T07:00:00Z" },
                end: { dateTime: "2019-10-12T07:45:00Z" }
            }
            const result = toMiteEntry(calendarEntry)

            expect(result).toEqual(either.left("no #mite event"))
        })

        it("should return an error when all-day-event was given", () => {
            const calendarEntry: calendar_v3.Schema$Event = {
                summary: "CoP-DEV",
                description: "mite should not parse this event",
                start: { date: "2019-10-12" },
                end: { date: "2019-10-13" }
            }
            const result = toMiteEntry(calendarEntry)

            expect(result).toEqual(either.left("all-day-event"))
        })

        it("should ignore unfilled description", () => {
            const calendarEntry: calendar_v3.Schema$Event = {
                summary: "CoP-DEV",
                description: undefined,
                start: { dateTime: "2019-10-12T07:00:00Z" },
                end: { dateTime: "2019-10-12T07:45:00Z" }
            }
            const result = toMiteEntry(calendarEntry)

            expect(result).toEqual(either.left("no #mite event"))
        })

        it("should return an error when start or end are missing", () => {
            const calendarEntry: calendar_v3.Schema$Event = {
                summary: "CoP-DEV",
                description: "a description",
            }
            const result = toMiteEntry(calendarEntry)

            expect(result).toEqual(either.left("start/end are missing"))
        })

        it("should return an error when the summary is missing", () => {
            const calendarEntry: calendar_v3.Schema$Event = {
                summary: undefined,
                description: "#mite 1111/2222 a description",
                start: { dateTime: "2019-10-12T07:00:00Z" },
                end: { dateTime: "2019-10-12T07:45:00Z" }
            }
            const result = toMiteEntry(calendarEntry)

            expect(result).toEqual(either.left("summary is missing"))
        })
    })

    describe("containsMiteEntry", () => {
        const dateAt = "2020-11-26"
        const description = "meeting 1"
        const duration = 30
        const projectId = 111
        const serviceId = 222

        const addTimeEntryOptions: AddTimeEntryOptions = {
            date_at: dateAt,
            note: description,
            minutes: duration,
            project_id: projectId,
            service_id: serviceId,
        }

        it("should return true when the date, description, duration, projectId and serviceId match", () => {
            const list: TimeEntries = [{ time_entry: <TimeEntry>addTimeEntryOptions }]

            const result = containsMiteEntry(addTimeEntryOptions, list)

            expect(result).toEqual(true)
        })

        it("should false when either of date, description, duration, projectId and serviceId don't match match", () => {
            const list: TimeEntries = [
                // { time_entry: <TimeEntry>addTimeEntryOptions },
                { time_entry: <TimeEntry>{
                    ...addTimeEntryOptions,
                    date_at: "not matching",
                } },
                { time_entry: <TimeEntry>{
                    ...addTimeEntryOptions,
                    note: "not matching",
                } },
                { time_entry: <TimeEntry>{
                    ...addTimeEntryOptions,
                    minutes: 999999999,
                } },
                { time_entry: <TimeEntry>{
                    ...addTimeEntryOptions,
                    project_id: 99999999,
                } },
                { time_entry: <TimeEntry>{
                    ...addTimeEntryOptions,
                    service_id: 99999999,
                } },
            ]

            const result = containsMiteEntry(addTimeEntryOptions, list)

            expect(result).toEqual(false)
        })
    })
})