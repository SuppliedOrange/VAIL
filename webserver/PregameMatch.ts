export default interface PregameMatch {
    username: string,
    matchID: string,
    time: number,
    didInstalock: "Yes" | "No" | "Undetermined (Error)" | "Undetermined (Insufficient Data)" | "Undetermined (Did not check)",
    netReward: number
}