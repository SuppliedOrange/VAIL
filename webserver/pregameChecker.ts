import { Collection, Document } from "mongodb"
import axios, { AxiosError } from "axios"
import {PregameMatch, PregameMatchCheckResult} from "./PregameMatch";
import * as errors from "./Errors";
import * as winston from 'winston';

// Configure Winston logger
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ filename: 'pregameChecker.log' }),
        new winston.transports.Console({}),
    ]
});

interface pregameProperties {
    endpoint: string,
    clientPlatform: string,
    clientVersion: string,
    entitlementsJWT: string,
    authorization: string
    username: string
    matchID: string
    playerID: string
    usersCollection: Collection<Document>
    pregameMatchesCollection: Collection<Document>,
}

async function fetchPregameMatch(
    properties: Pick<
        pregameProperties,
        "endpoint" | "clientPlatform" | "clientVersion" | "entitlementsJWT" | "authorization"
    >
) {
    logger.info(`[fetchPregameMatch] Starting fetch request to endpoint: ${properties.endpoint}`);
    const { endpoint, clientPlatform, clientVersion, entitlementsJWT, authorization } = properties;

    try {
        logger.debug(`[fetchPregameMatch] Making GET request with client version: ${clientVersion}`);
        const response = await axios.get(endpoint, {
            headers: {
                "X-Riot-ClientPlatform": clientPlatform,
                "X-Riot-ClientVersion": clientVersion,
                "X-Riot-Entitlements-JWT": entitlementsJWT,
                "Authorization": authorization
            }
        });
        logger.info(`[fetchPregameMatch] Received response with status: ${response.status}`);
        logger.debug(`[fetchPregameMatch] Queue ID: ${response.data?.QueueID}`);

        if (
            response.data?.QueueID != "unrated" && response.data?.QueueID != "competitive" 
            && response.data?.ProvisioningFlowID != "CustomGame" // If testing
        ) {
            logger.warn(`[fetchPregameMatch] Invalid queue type: ${response.data?.QueueID}`);
            throw new errors.UserError(null, "The player is not in a competitive/unrated match");
        }

        logger.info(`[fetchPregameMatch] Successfully retrieved pregame match data`);
        return response.data;
    }
    catch (err) {
        logger.error(`[fetchPregameMatch] Error occurred while fetching: ${err}`);
        if (err instanceof errors.BaseError) {
            throw err;
        }

        if (err instanceof AxiosError) {
            if (err.status == 404) {
                logger.info(`[fetchPregameMatch] Player not in pregame lobby (404)`);
                throw new errors.NotInPregameError(err.message, "The player is not in a pregame lobby");
            }
            else {
                logger.error(`[fetchPregameMatch] Axios error: ${err.message}, Status: ${err.status}`);
                throw new errors.ThirdPartyError(err.message, "An error occurred while fetching the pregame match");
            }
        }
    }        
}

export default async function analyzePregame(properties: pregameProperties) {
    logger.info(`[analyzePregame] Starting analysis for user: ${properties.username}, match: ${properties.matchID}`);
    
    const endpoint = properties.endpoint;
    const clientPlatform = properties.clientPlatform;
    const clientVersion = properties.clientVersion;
    const entitlementsJWT = properties.entitlementsJWT;
    const authToken = properties.authorization;
    const playerID = properties.playerID;
    const username = properties.username;
    const matchID = properties.matchID;
    const usersCollection = properties.usersCollection;
    const pregameMatchesCollection = properties.pregameMatchesCollection;

    logger.debug(`[analyzePregame] Initialized with clientVersion: ${clientVersion}, playerID: ${playerID}`);

    const maxRetryLimit = 3;
    const loopTimeout = 15000;
    let continueIterations: boolean = true;

    if (!endpoint || !clientPlatform || !clientVersion || !entitlementsJWT || !authToken) {
        logger.error('[analyzePregame] Missing required properties');
        return {
            error: "Malformed request\nRequired properties: endpoint, clientPlatform, clientVersion, entitlementsJWT, authToken"
        };
    }

    let pregameMatchLog: PregameMatch = {
        username: username,
        matchID: matchID,
        time: Date.now(),
        didInstalock: "Undetermined (Did not check)",
        netReward: 0,
        timesChecked: 0,
        timesErrorOccurred: 0,
        checkResults: []
    };

    logger.info(`[analyzePregame] Created initial pregame match log for match ${matchID}`);

    try {
        await createPregameMatchLog(pregameMatchLog, pregameMatchesCollection);
    }
    catch (e) {
        logger.error(`[analyzePregame] Failed to create initial pregame match log: ${e}`);
    }

    logger.info(`[analyzePregame] Starting main analysis loop`);
    while (continueIterations) {
        if (pregameMatchLog.timesErrorOccurred >= maxRetryLimit) {
            logger.warn(`[analyzePregame] Reached max retry limit (${maxRetryLimit}), stopping analysis`);
            continueIterations = false;
            continue;
        }

        pregameMatchLog.timesChecked += 1;
        logger.info(`[analyzePregame] Starting check iteration ${pregameMatchLog.timesChecked}`);

        try {

            logger.debug(`[analyzePregame] Waiting ${loopTimeout}ms before next check`);

            await new Promise(r => setTimeout(r, loopTimeout));

            logger.info(`[analyzePregame] Fetching pregame match data`);

            const pregameMatch = await fetchPregameMatch({
                endpoint,
                clientPlatform,
                clientVersion,
                entitlementsJWT,
                authorization: authToken
            });

            logger.debug(`[analyzePregame] Successfully received pregame match data for iteration ${pregameMatchLog.timesChecked}`);
            
            pregameMatchLog.checkResults.push({
                result: pregameMatch,
                time: Date.now(),
                success: true
            });

        }

        catch (error) {
            if (error instanceof errors.NotInPregameError) {
                logger.info(`[analyzePregame] Pregame phase ended, finalizing analysis`);
                continueIterations = false;

                pregameMatchLog.checkResults.push({
                    result: {error: error.message},
                    time: Date.now(),
                    success: false
                });

                continue;
            }
            else if (error instanceof errors.ThirdPartyError) {
                logger.error(`[analyzePregame] Third party error occurred: ${error.message}`);
                pregameMatchLog.timesErrorOccurred += 1;

                pregameMatchLog.checkResults.push({
                    result: {error: error.message},
                    time: Date.now(),
                    success: false
                });

                continue;
            }
            else {
                logger.error(`[analyzePregame] Unknown error occurred: ${error}`);
                pregameMatchLog.timesErrorOccurred += 1;

                pregameMatchLog.checkResults.push({
                    result: {error: error.message},
                    time: Date.now(),
                    success: false
                });

                continue;
            }
        }
    }

    logger.info(`[analyzePregame] Analysis loop completed, analyzing results`);

    const { didInstalock, netReward } = analyzeResults(pregameMatchLog.checkResults, playerID);
    
    pregameMatchLog.didInstalock = didInstalock;
    pregameMatchLog.netReward = netReward;

    await rewardUser(username, netReward, usersCollection);

    logger.info(`[analyzePregame] Analysis complete - Instalock: ${didInstalock}, Net Reward: ${netReward}`);
    logger.debug(`[analyzePregame] Final pregame match log: ${JSON.stringify(pregameMatchLog)}`);

    await updatePregameMatchLog(
        pregameMatchLog, 
        pregameMatchLog,
        pregameMatchesCollection
    );

    return pregameMatchLog;
}

function analyzeResults(results: PregameMatchCheckResult[], playerID: string) {
    logger.info(`[analyzeResults] Starting analysis for player ${playerID} with ${results.length} results`);
    
    let didInstalock: "Yes" | "No" | "Undetermined (Error)" | "Undetermined (Insufficient Data)" | "Undetermined (Did not check)" = "Undetermined (Did not check)";
    let netReward: number = 0;

    logger.debug(`[analyzeResults] Checking if locked in early`);
    const lockedInEarly = checkIfLockedInEarly(results, playerID);

    if (lockedInEarly) {
        logger.info(`[analyzeResults] Player locked in early`);
        didInstalock = "Yes";
        netReward = -0.001;

        return {
            didInstalock,
            netReward
        }
    }

    if (results.length < 2) {
        logger.info(`[analyzeResults] Insufficient data: only ${results.length} results`);
        didInstalock = "Undetermined (Insufficient Data)";
        return {
            didInstalock,
            netReward
        }
    }

    if (results.length == 2) {
        logger.debug(`[analyzeResults] Analyzing with exactly 2 results`);
        let isLocked: boolean;
        
        try {
            isLocked = determineIfLocked(playerID, results[0].result);
            logger.debug(`[analyzeResults] First check locked status: ${isLocked}`);
        }
        catch (error) {
            logger.error(`[analyzeResults] Error determining locked status: ${error}`);
            didInstalock = "Undetermined (Error)";
            return {
                didInstalock,
                netReward
            }
        }

        if (isLocked) {
            logger.info(`[analyzeResults] Locked in first check, insufficient data`);
            didInstalock = "Undetermined (Insufficient Data)";
        }
        else {
            logger.info(`[analyzeResults] Not locked in first check, confirmed no instalock`);
            didInstalock = "No";
            netReward = 0.001;
        }
    }
    else {
        logger.debug(`[analyzeResults] Analyzing with ${results.length} results`);
        const filteredBySuccessful = results.filter((result: PregameMatchCheckResult) => result.success);
        const last3Results = filteredBySuccessful.slice(-3);
        logger.debug(`[analyzeResults] Analyzing last 3 successful results: ${JSON.stringify(last3Results)}`);

        const allLocked = last3Results.every((result: PregameMatchCheckResult) => determineIfLocked(playerID, result.result));
        if (allLocked) {
            logger.info(`[analyzeResults] All last 3 results locked, confirmed instalock`);
            didInstalock = "Yes";
            netReward = -0.001;
        }
        else {
            logger.info(`[analyzeResults] Not all results locked, confirmed no instalock`);
            didInstalock = "No";
            netReward = 0.001;
        }
    }

    logger.info(`[analyzeResults] Analysis complete - Result: ${didInstalock}, Reward: ${netReward}`);
    return {
        didInstalock,
        netReward
    };
}

function checkIfLockedInEarly(results: PregameMatchCheckResult[], playerID: string) {
    logger.info(`[checkIfLockedInEarly] Starting early lock check for player ${playerID}`);
    
    const filteredBySuccessful = results.filter((result: PregameMatchCheckResult) => result.success);
    logger.debug(`[checkIfLockedInEarly] Found ${filteredBySuccessful.length} successful results`);
    
    if (filteredBySuccessful.length == 0) {
        logger.info(`[checkIfLockedInEarly] No successful results found`);
        return false
    }

    const lockedInResults = filteredBySuccessful.filter((result: PregameMatchCheckResult) => determineIfLocked(playerID, result.result));
    logger.debug(`[checkIfLockedInEarly] Found ${lockedInResults.length} locked-in results`);
    
    if (lockedInResults.length == 0) {
        logger.info(`[checkIfLockedInEarly] No locked-in results found`);
        return false;
    }

    const firstLockedInResult = lockedInResults[0];
    logger.debug(`[checkIfLockedInEarly] First locked result time remaining: ${firstLockedInResult.result.PhaseTimeRemainingNS}`);
    
    if (firstLockedInResult.result.PhaseTimeRemainingNS > 30000000000) {
        logger.info(`[checkIfLockedInEarly] Early lock-in detected`);
        return true;
    }
    
    logger.info(`[checkIfLockedInEarly] No early lock-in detected`);
    return false;
}

async function createPregameMatchLog(pregameMatch: PregameMatch, pregameMatchesCollection: Collection<Document>) {
    logger.info(`[createPregameMatchLog] Creating new log for match ${pregameMatch.matchID}`);
    try {
        await pregameMatchesCollection.insertOne(pregameMatch);
        logger.info(`[createPregameMatchLog] Successfully created pregame match log`);
    }
    catch (e) {
        logger.error(`[createPregameMatchLog] Database error: ${e}`);
        throw new errors.InternalServerError(e, "An internal server error occurred while creating a new pregame match log");
    }
}

async function updatePregameMatchLog(pregameMatch: PregameMatch, changes: Partial<PregameMatch>, pregameMatchesCollection: Collection<Document>) {
    logger.info(`[updatePregameMatchLog] Updating log for match ${pregameMatch.matchID}`);
    try {
        await pregameMatchesCollection.updateOne(
            { matchID: pregameMatch.matchID, username: pregameMatch.username }, 
            { $set: changes }
        );
        logger.info(`[updatePregameMatchLog] Successfully updated pregame match log`);
    }
    catch (e) {
        logger.error(`[updatePregameMatchLog] Database error: ${e}`);
        throw new errors.InternalServerError(e, "An internal server error occurred while updating the pregame match log");
    }
}

function determineIfLocked(playerID: string, result: { [key: string]: any }) {
    logger.debug(`[determineIfLocked] Checking lock status for player ${playerID}`);
    try {
        const teams = result?.Teams;
        if (!teams) {
            logger.error(`[determineIfLocked] Malformed response - missing Teams`);
            throw new errors.ThirdPartyError(null, "The response from the pregame match was malformed");
        }

        const team = teams.find((team: { Players: any[] }) => team.Players.find((player: { Subject: string }) => player.Subject === playerID));
        if (!team) {
            logger.error(`[determineIfLocked] Player ${playerID} not found in any team`);
            throw new errors.ThirdPartyError(null, "The player was not found in the pregame match");
        }

        const player = team.Players.find((player: { Subject: string }) => player.Subject === playerID);
        logger.debug(`[determineIfLocked] Found player data: ${JSON.stringify(player)}`);
        
        const isLocked = player.CharacterSelectionState === "Locked";
        logger.info(`[determineIfLocked] Player ${playerID} lock status: ${isLocked}`);

        return isLocked;
    }
    catch (error) {
        if (error instanceof errors.BaseError) {
            logger.error(`[determineIfLocked] Known error type: ${error.message}`);
            throw error;
        }
        else {
            logger.error(`[determineIfLocked] Unknown error determining lock status: ${error}`);
            throw new errors.InternalServerError(error, "An internal server error occurred while determining if the player was locked in");
        }
    }
}

async function rewardUser(username: string, reward: number, usersCollection: Collection<Document>) {

    logger.info(`[rewardUser] Rewarding user ${username} with ${reward}`);

    try {

        // Add reward to claimable balance

        await usersCollection.updateOne(
            { username: username },
            { $inc: { diamClaimable: reward } }
        );

        logger.info(`[rewardUser] Successfully rewarded user`);
    }

    catch (e) {
        logger.error(`[rewardUser] Database error: ${e}`);
        throw new errors.InternalServerError(e, "An internal server error occurred while rewarding the user");
    }

}