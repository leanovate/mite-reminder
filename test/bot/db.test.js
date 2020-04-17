const { loadUsers } = require("../../bot/db")

describe("db.js", () => {
    describe("loading users from csv", () => {
        it("should parse a user from the file", async () => {
            const users = await loadUsers("test/bot/test-users.csv")
            
            expect(users).toEqual([
                {
                    name: "Test Testing",
                    slackId: "slack-id-1",
                    miteId: "mite-id-1"
                },
                {
                    name: "Test Testing Junior",
                    slackId: "slack-id-2",
                    miteId: "mite-id-2"
                }
            ])
        })
    })
})