export interface AppError {
    presentableMessage: string
}

export class UserIsUnknown implements AppError {
    presentableMessage = "I don't know you. Please provide your API key. Say 'register <API_KEY>' to solve this issue. You can get an api key from your mite web ui."
    constructor(readonly slackId: string) {
        console.warn(`The user with slack id ${slackId} cannot be connected to a mite account. Can be fixed by providing a personal api key for the user.`)
    }
}
export class ApiKeyIsMissing implements AppError {
    presentableMessage = "I don't know you. Please provide your API key. Say 'register <API_KEY>' to solve this issue. You can get an api key from your mite web ui."
    constructor(readonly slackId: string) {
        console.warn("A global api key is missing")
    }
}
export class UnknownAppError implements AppError {
    presentableMessage: string
    constructor(readonly error: unknown) {
        console.error("There is an unexpected error:", error)
        this.presentableMessage = (error as Error)?.message ?? "There was an unexpected error :(" 
    }
}

export class IOError implements AppError {
    presentableMessage = "OOPSIE WOOPSIE!! Our hawd drive did a fucky wucky!! A wittle fucko boingo!"
    constructor(readonly error: Error) {
        console.warn("Failed to access the file system", error)
    }
}