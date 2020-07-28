import { lastWeekThursdayToThursday, lastMonth } from "../../src/mite/time"
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


    describe("getting previous month", () => {
        const dateFormat = "YYYY-MM-DD"
        test("on the first day of the month, it should return last months dates ", () => {
            const friday = moment("2019-06-01", dateFormat)

            const { start, end } = lastMonth(friday)

            expect(start.format(dateFormat)).toEqual("2019-05-01")
            expect(end.format(dateFormat)).toEqual("2019-05-31")
        })
        
        test("on the last day of the month, it should return last months dates ", () => {
            const friday = moment("2019-06-30", dateFormat)

            const { start, end } = lastMonth(friday)

            expect(start.format(dateFormat)).toEqual("2019-05-01")
            expect(end.format(dateFormat)).toEqual("2019-05-31")
        })
        
        test("should return last months date for february ", () => {
            const friday = moment("2019-03-01", dateFormat)

            const { start, end } = lastMonth(friday)

            expect(start.format(dateFormat)).toEqual("2019-02-01")
            expect(end.format(dateFormat)).toEqual("2019-02-28")
        })
    })
})