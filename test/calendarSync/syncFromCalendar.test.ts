import { either } from "fp-ts"
import { calendar_v3, GoogleApis } from "googleapis"
import { AuthPlus, GaxiosPromise } from "googleapis/build/src/apis/ml"
import { AddTimeEntryOptions, MiteApi, TimeEntries, TimeEntry } from "mite-api"
import moment from "moment"
import { addCalendarEntriesToMite, containsMiteEntry, toMiteEntry } from "../../src/calendarSync/syncFromCalendar"
import { CheckContext } from "../../src/slack/userContext"

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

    describe("addCalendarEntriesToMite", () => {
        it("add new (and only new) calendar events to mite", async () => {
            const addTimeEntryMock = jest.fn((params, callback) => callback(undefined, { time_entry: {} as unknown as TimeEntry }))
            const existingTimeEntries: TimeEntries = [
                { time_entry: {
                    date_at: "2019-10-12",
                    note: "meeting already in mite",
                    minutes: 45,
                    project_id: 111,
                    service_id: 222,
                } as TimeEntry }
            ]
            const miteApi = <MiteApi>{
                addTimeEntry: addTimeEntryMock,
                getTimeEntries: (params, callback) => { callback(undefined, existingTimeEntries) },
                getUsers: jest.fn()
            }
            const calendarEntries: calendar_v3.Schema$Event[] = [
                {
                    summary: "new meeting",
                    description: "#mite 111/222",
                    start: { dateTime: "2019-10-12T07:00:00Z" },
                    end: { dateTime: "2019-10-12T07:45:00Z" }
                },
                {
                    summary: "meeting already in mite",
                    description: "#mite 111/222",
                    start: { dateTime: "2019-10-12T07:00:00Z" },
                    end: { dateTime: "2019-10-12T07:45:00Z" }
                }
            ]
            const calendarEvents = <GaxiosPromise<calendar_v3.Schema$Events>>Promise.resolve({
                data: {
                    items: calendarEntries
                }
            })
            const googleApi = {
                calendar: () => ({
                    events: {
                        list: () => calendarEvents
                    }
                }),
                auth: {
                    JWT: jest.fn(() => ({ authorize: () => Promise.resolve() }))
                } as unknown as AuthPlus
            } as unknown as GoogleApis
            const checkContext: CheckContext = {
                miteApi,
                slackId: "slackId",
                repository: { loadUser: () => ({ miteId: 1234 }) }
            } as unknown as CheckContext
            const userEmail = "userEmail"
            const now = moment("2020-12-31")

            await addCalendarEntriesToMite(checkContext, googleApi, userEmail, now)()
            
            expect(addTimeEntryMock).toHaveBeenCalledTimes(1)
        })
    })
})