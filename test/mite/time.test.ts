import { lastWeekThursdayToThursday, lastMonth, lastFortyDays, formatTimeReadable } from "../../src/mite/time"
import moment from "moment"


describe("time", () => {
    describe("getting the previous week from thursday to thursday", () => {
        const dateFormat = "YYYY-MM-DD"
        test("On a friday, the end should be yesterday (thursday) ", () => {
            const friday = moment("2019-06-14", dateFormat)

            const { start, end } = lastWeekThursdayToThursday(friday)

            expect(start.format(dateFormat)).toEqual("2019-06-06")
            expect(end.format(dateFormat)).toEqual("2019-06-13")
        })

        test("On a thursday, the end should the thursday from the previous week ", () => {
            const thursday = moment("2019-06-13", dateFormat)

            const { start, end } = lastWeekThursdayToThursday(thursday)

            expect(start.format(dateFormat)).toEqual("2019-05-30")
            expect(end.format(dateFormat)).toEqual("2019-06-06")
        })

        test("On a wednesday, the end should the thursday from the previous week ", () => {
            const thursday = moment("2019-06-12", dateFormat)

            const { start, end } = lastWeekThursdayToThursday(thursday)

            expect(start.format(dateFormat)).toEqual("2019-05-30")
            expect(end.format(dateFormat)).toEqual("2019-06-06")
        })
    })

    describe("getting the last 40 days", () => {
        const dateFormat = "YYYY-MM-DD"
        test("should include the last forty days, but not today", () => {
            const friday = moment("2019-06-15", dateFormat)

            const { start, end } = lastFortyDays(friday)

            expect(start.format(dateFormat)).toEqual("2019-05-06")
            expect(end.format(dateFormat)).toEqual("2019-06-14")
        })
    })


    describe("getting previous month", () => {
        const dateFormat = "YYYY-MM-DD"
        test("on the first day of the month, it should return last months dates ", () => {
            const day = moment("2019-06-01", dateFormat)

            const { start, end } = lastMonth(day)

            expect(start.format(dateFormat)).toEqual("2019-05-01")
            expect(end.format(dateFormat)).toEqual("2019-05-31")
        })
        
        test("on the last day of the month, it should return last months dates ", () => {
            const day = moment("2019-06-30", dateFormat)

            const { start, end } = lastMonth(day)

            expect(start.format(dateFormat)).toEqual("2019-05-01")
            expect(end.format(dateFormat)).toEqual("2019-05-31")
        })
        
        test("should return last months date for february ", () => {
            const day = moment("2019-03-01", dateFormat)

            const { start, end } = lastMonth(day)

            expect(start.format(dateFormat)).toEqual("2019-02-01")
            expect(end.format(dateFormat)).toEqual("2019-02-28")
        })
    })

    describe("formatTimeReadable", () => {
        const dateFormat = "YYYY-MM-DD"
        test("formats the time according to the moment locale", () => {

            moment.locale("de")
            const tuesdayGerman = moment("2020-06-02", dateFormat)
            moment.locale("en")
            const tuesdayEnglish = moment("2020-06-02", dateFormat)
            
            expect(formatTimeReadable(tuesdayGerman)).toEqual("Di 2020/06/02")
            expect(formatTimeReadable(tuesdayEnglish)).toEqual("Tu 2020/06/02")
        })
    })
})