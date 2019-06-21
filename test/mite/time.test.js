const { isTimeEnteredOnDay, getDatesBetween } = require("../../mite/time")
const moment = require("../../moment-holiday-berlin.min")

describe("time.js", () => {
    const dateFormat = "YYYY-MM-DD"
    describe("isTimeEnteredOnDay", () => {
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

    describe("getDatesBetween", () => {
        it("should return 3 days between 2001-12-01 and 2001-12-03", () => {
            const start = moment("2001-12-01", dateFormat)
            const end = moment("2001-12-03", dateFormat)

            const datesBetween = getDatesBetween(start, end)
                .map(m => m.format(dateFormat))

            expect(datesBetween).toContain("2001-12-01")
            expect(datesBetween).toContain("2001-12-02")
            expect(datesBetween).toContain("2001-12-03")
        })

        
        it("should return 1 days between 2001-12-01 and 2001-12-01", () => {
            const start = moment("2001-12-01", dateFormat)
            const end = moment("2001-12-01", dateFormat)

            const datesBetween = getDatesBetween(start, end)
                .map(m => m.format(dateFormat))

            expect(datesBetween).toContain("2001-12-01")
        })
    })
})