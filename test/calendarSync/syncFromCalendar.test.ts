import { calendar_v3 } from "googleapis"
import { toMiteEntry } from "../../src/calendarSync/syncFromCalendar"

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

            expect(result).toEqual({
                date_at: "2019-10-12", 
                minutes: 45, 
                note: "CoP-DEV", 
                project_id: projectId, 
                service_id: serviceId, 
                // user_id: 0 // TODO
            })
        })

        // TODO test whole day (date instead of datetime)
    })
})