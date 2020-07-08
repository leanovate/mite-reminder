declare module 'mite-api' {
    export interface MiteApi {
        getTimeEntries: GetTimeEntries;
        getUser: GetUser;
    }

    export type GetTimeEntries = (
        { from: string, to: string, user_id: string },
        callback: GetTimeEntriesCallBack) => void

    export type GetUser = (
        userId: string,
        callback: GetUserCallback) => void

    export type GetTimeEntriesCallBack = (error: any, result: TimeEntries | MiteApiError) => void
    export type GetUserCallback = (error: any, result: Users | MiteApiError) => void

    export type MiteApiError = { error: string }

    export = ({ account: string, apiKey: string, applicationName: string }) => MiteApi;
}