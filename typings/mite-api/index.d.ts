declare module 'mite-api' {
    export interface MiteApi {
        getTimeEntries: GetTimeEntries;
        getUser: GetUser;
    }

    export type MiteApiError = { error: string }

    export type GetTimeEntries = (
        { from: string, to: string, user_id: string },
        callback: GetTimeEntriesCallBack) => void

    export type GetUser = (
        userId: string,
        callback: GetUserCallback) => void

    export type GetTimeEntriesCallBack = (error: unknown, result: TimeEntries | MiteApiError) => void
    export type GetUserCallback = (error: unknown, result: Users | MiteApiError) => void

    type MiteApiConstructorParams = { account: string, apiKey: string, applicationName: string }
    export = (params: MiteApiConstructorParams): MiteApi => MiteApi;
}