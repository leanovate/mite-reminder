const { isTimeEnteredOnDay } = require("../../mite/time")
const moment = require("../../moment-holiday-berlin.min")

describe("time.js", () => {
    describe("isTimeEnteredOnDay", () => {
        const dateFormat = "YYYY-MM-DD"
        const miteEntries = [
            {
                time_entry: {
                    date_at: "2001-03-30",
                    minutes: 0
                }
            },
            {
                time_entry: {
                    date_at: "2001-03-30",
                    minutes: 300
                }
            },
            {
                time_entry: {
                    date_at: "2001-03-28",
                    minutes: 0
                }
            },
            {
                time_entry: {
                    date_at: "2001-03-27",
                    minutes: 600
                }
            },
        ]

        it("should report as entered when there is a >0 time entry", () => {
            const dayToCheck = moment("2001-03-27", dateFormat)

            expect(isTimeEnteredOnDay(miteEntries, dayToCheck)).toBeTruthy()
        })
        it("should report as missing when there is a ==0 time entry", () => {
            const dayToCheck = moment("2001-03-28", dateFormat)

            expect(isTimeEnteredOnDay(miteEntries, dayToCheck)).toBeFalsy()
        })
        it("should report as entered when there is a >0 next to a ==0 time entry", () => {
            const dayToCheck = moment("2001-03-30", dateFormat)

            expect(isTimeEnteredOnDay(miteEntries, dayToCheck)).toBeTruthy()
        })
        it("should report as missing when there is no time entry", () => {
            const dayToCheck = moment("1980-01-01", dateFormat)

            expect(isTimeEnteredOnDay(miteEntries, dayToCheck)).toBeFalsy()
        })
    })
})