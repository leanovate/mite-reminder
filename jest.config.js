// eslint-disable-next-line no-undef
module.exports = {
    transform: {"^.+\\.ts?$": "ts-jest"},
    testEnvironment: "node",
    testRegex: "/test/.*\\.(test|spec)?\\.ts$",
    moduleFileExtensions: ["ts", "js", "json", "node"],
    preset: "ts-jest"
}