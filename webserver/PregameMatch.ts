export interface PregameMatch {
    username: string,
    playerID: string,
    matchID: string,
    time: number,
    didInstalock: "Yes" | "No" | "Undetermined (Error)" | "Undetermined (Insufficient Data)" | "Undetermined (Did not check)",
    netReward: number,
    timesChecked: number,
    timesErrorOccurred: number,
    checkResults: PregameMatchCheckResult[]
}

export interface PregameMatchCheckResult {

    result: { [key: string]: any },
    time: number,
    success: boolean

}