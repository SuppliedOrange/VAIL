import { Collection, Document } from "mongodb"
import axios from "axios"
import fs from 'fs';

interface pregameProperties {

    endpoint: string,
    clientPlatform: string,
    clientVersion: string,
    entitlementsJWT: string,
    authorization: string
    username: string
    matchID: string
    usersCollection: Collection<Document>
    pregameMatchesCollection: Collection<Document>,

}

async function fetchPregameMatch(

    properties: Pick<
        pregameProperties,
        "endpoint" | "clientPlatform" | "clientVersion" | "entitlementsJWT" | "authorization"
    >

    ) {

        const { endpoint, clientPlatform, clientVersion, entitlementsJWT, authorization } = properties;
        const response = await axios.get(endpoint, {
            headers: {
                "X-Riot-ClientPlatform": clientPlatform,
                "X-Riot-ClientVersion": clientVersion,
                "X-Riot-Entitlements-JWT": entitlementsJWT,
                "Authorization": `Bearer ${authorization}`
            }
        });
        
        if (response.status === 200) {
            return response.data;
        }

        else if (response.status === 404) {
            return {
                error: "Pregame session has been terminated.",
                code: "PREGAME_TERMINATED"
            };
        }

        else {
            return {
                error: response.data,
                code: `Code: ${response.status}, ${response.statusText}`
            }
        }

}

export default async function analyzePregame( properties: pregameProperties ) {

    const endpoint = properties.endpoint;
    const clientPlatform = properties.clientPlatform;
    const clientVersion = properties.clientVersion;
    const entitlementsJWT = properties.entitlementsJWT;
    const authToken = properties.authorization;

    // Stuff to use for databases
    const username = properties.username;
    const matchID = properties.matchID;
    const usersCollection = properties.usersCollection;
    const pregameMatchesCollection = properties.pregameMatchesCollection;

    // Stuff to use locally
    let iterations: number = 0;
    let lockedOnIteration: null | number = null;
    let retriesOnError: number = 0;

    if (
        !endpoint        ||
        !clientPlatform  ||
        !clientVersion   ||
        !entitlementsJWT ||
        !authToken
    ) {
        return {
            error: "Malformed request\nRequired properties: endpoint, clientPlatform, clientVersion, entitlementsJWT, authToken"
        };
    }

    /**
     * Make a request to the endpoint with these headers:
     * Headers:
        X-Riot-ClientPlatform: {client platform}
        X-Riot-ClientVersion: {client version}
        X-Riot-Entitlements-JWT: {entitlement token}
        Authorization: Bearer {auth token}
     */


    const pregameMatch = await fetchPregameMatch({
        endpoint,
        clientPlatform,
        clientVersion,
        entitlementsJWT,
        authorization: authToken
    });

    console.log(pregameMatch);
    // save it to pregameMatchDetails.json
    fs.writeFileSync('pregameMatchDetails.json', JSON.stringify(pregameMatch, null, 4));

    return {
        endpoint,
        clientPlatform,
        clientVersion,
        entitlementsJWT,
        authToken
    };

}