export interface PregameMatch {
    username: string,
    matchID: string,
    time: number,
    didInstalock: "Yes" | "No" | "Undetermined (Error)" | "Undetermined (Insufficient Data)" | "Undetermined (Did not check)",
    netReward: number,
    timesChecked: number,
    timesErrorOccurred: number,
    checkResults: PregameMatchCheckResult[]
}

export interface PregameMatchCheckResult {

    result: { [key: string]: unknown },
    time: number,
    success: boolean

}