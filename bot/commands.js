const { parseArgsStringToArgv } = require('string-argv');
const getCommand = input => {
    const parsedArguments = parseArgsStringToArgv(input)
    switch (parsedArguments[0]) {
        case "register":
            return {
                name: "register",
                miteApiKey: parsedArguments[1]
            }
        case "unregister":
            return { name: "unregister" }
        case "help":
            return { name: "help" }
        case "check":
            return { name: "check" }
        default:
            return { name: "unknown" }
    }
}

module.exports = {
    getCommand
}