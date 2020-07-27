export interface AppError {
    message: string
}

export class UserIsUnknown implements AppError {
    message: string
    constructor(readonly slackId: string) {
        this.message = `The user with slack id ${slackId} cannot be connected to a mite account. Can be fixed by providing a personal api key for the user.`
    }
}
export class ApiKeyIsMissing implements AppError {
    message: string
    constructor(readonly slackId: string) {
        this.message = "A global api key is missing" //FIXME What case does that cover?
        // 1. Neither personal nor admin api key are present
    }
}
export class UnknownAppError implements AppError {
    message: string
    constructor(readonly error: unknown) {
        console.error("There is an unexpected error:", error)
        this.message = (error as Error)?.message ?? "Oh, something went wrong :(" // TODO
    }
}

export class IOError implements AppError {
    message = "Could not write/read to/from disk"
    constructor(readonly error: Error) {
    }
}