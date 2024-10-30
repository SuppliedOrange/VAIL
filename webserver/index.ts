import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import {configDotenv} from "dotenv"
import { MongoClient } from 'mongodb';
import * as accountFunctions from './accountFunctions';
import * as errors from "./Errors"
import sha256 from 'sha256';
import analyzePregame from './pregameChecker';

configDotenv({path: ".env"});

// Create a mongodb client
console.log(process.env.MONGODB_URI);
const client = new MongoClient(process.env.MONGODB_URI as string);
const database = client.db("diam");
const usersCollection = database.collection("users");
const pregameMatchesCollection = database.collection("pregameMatches");

// Create the express server
const app = express();
const port = 3001;
app.use(bodyParser.json());
app.use(cors());

// Create an aurora server
// const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

//@ts-expect-error Unsure why this happens
app.post('/create-account', async function (req, res) {

        console.log('Received request to create an account');

        if (
            !req.body.username ||
            !req.body.password || 
            !req.body.email    ||
            !req.body.type
        ) {
            res.status(400);
            return res.send({
                error: "Malformed request"
            });
        }

        const username = req.body.username;
        const password = req.body.password;
        const email = req.body.email;
        const type = req.body.type;

        // Validate data
        for (const credential of [username, password, email, type]) {
            if (typeof credential != 'string' || credential.length < 1) {
                res.status(400);
                return res.send({error: `Expected "${credential}" to be a string`});
            }
        }

        // password = sha256(username + password)
        const encoded_password = sha256(username + password);

        try {

            const accountDetails = await accountFunctions.createAccount({
                username,
                encoded_password,
                email,
                type,
                diamClaimable: 0
            }, usersCollection);

            res.status(200);
            res.send(accountDetails);

        }
        catch (e) {
            console.log(e)
            if (e instanceof errors.BaseError) {
                res.status(e.errorCode);
                return res.send({
                    name: e.name,
                    error: e.message,
                    cause: e.cause,
                    errorCode: e.errorCode
                });
            }
        }
        

});

// @ts-expect-error Unsure why this happens
app.post('/check-pregame', async function (req, res) {

    /**
     *  Requires the following properties:
     *  endpoint - string
     *  pregameMatchID - string
     *  clientPlatform - string
     *  client version - string
     *  entitlementsJWT - string
     *  authToken - string
     * 
     *  Authorization:
     *  username - string
     *  accessToken - string
     */

    // Ensure above properties exist

    if (
        !req.body.username ||
        !req.body.accessToken
    ) {
        res.status(400);
        return res.send({
            error: "Malformed request\nRequired properties: username, accessToken"
        });
    }

    const username = req.body.username;
    const accessToken = req.body.accessToken;

    try {

        await accountFunctions.verifyAuthentication({
            username: username,
            encoded_password: accessToken
        }, usersCollection);

    }

    catch (error) {

        if (error instanceof errors.BaseError) {
            res.status(error.errorCode);
            return res.send({
                name: error.name,
                error: error.message,
                cause: error.cause,
                errorCode: error.errorCode
            });
        }

        else {
            res.status(500);
            return res.send({
                error: "Internal server error",
                cause: error
            });
        }

    }


    if (
        !req.body.endpoint ||
        !req.body.clientPlatform ||
        !req.body.clientVersion ||
        !req.body.entitlementsJWT ||
        !req.body.authToken
    ) {
        res.status(400);
        return res.send({
            error: "Malformed request\nRequired properties: endpoint, clientPlatform, clientVersion, entitlementsJWT, authToken"
        });
    }

    const endpoint = req.body.endpoint;
    const clientPlatform = req.body.clientPlatform;
    const clientVersion = req.body.clientVersion;
    const entitlementsJWT = req.body.entitlementsJWT;
    const authToken = req.body.authToken;
    const matchID = req.body.matchID;

    // check if the matchID is already in pregameMatchesCollection
    const match = await pregameMatchesCollection.findOne({ matchID: matchID, username: username });

    if (match) {
        res.status(400);
        return res.send({
            error: "Match already checked"
        });
    }
    
    // add the matchID to mongodb pregameMatchesCollection
    try {

        const result = await pregameMatchesCollection.insertOne({
            username: req.body.username,
            matchID: matchID,
            time: Date.now(),
            didInstalock: "Undetermined (Did not check)",
            netReward: 0
        });

        console.log(result);

        // Analyze the pregame
        await analyzePregame({
            endpoint,
            clientPlatform,
            clientVersion,
            entitlementsJWT,
            authorization: authToken,
            username,
            matchID,
            usersCollection,
            pregameMatchesCollection
        });

    }

    catch (error) {
        console.error('Error in check-pregame:', error);
        res.status(500).json({ error: error.message });
    }

    
});

//@ts-expect-error Unsure why this happens
app.post('/login', async function (req, res) {
    
        if (!req.body.username || !req.body.encoded_password) {
            res.status(400);
            return res.send({
                error: "Malformed request"
            });
        }
    
        const username = req.body.username;
        const encoded_password = req.body.encoded_password;
    
        try {
            const accountDetails = await accountFunctions.loginAccount({
                username,
                encoded_password // NOT good security. You'd wanna send them an expiring access token, not just the encoded pwd.
            }, usersCollection);
    
            res.status(200);
            res.send(accountDetails);
        }
    
        catch (e) {
            if (e instanceof errors.BaseError) {
                res.status(e.errorCode);
                return res.send({
                    name: e.name,
                    error: e.message,
                    cause: e.cause,
                    errorCode: e.errorCode
                });
            }
        }
    
})

//@ts-expect-error Unsure why this happens
app.get('/check-admin-account', async function (req, res) {
    
    try {
        const response = await accountFunctions.checkAdmin(usersCollection);
        res.status(200);
        res.send(response);
    }

    catch (e) {
        if (e instanceof errors.BaseError) {
            res.status(e.errorCode);
            return res.send({
                name: e.name,
                error: e.message,
                cause: e.cause,
                errorCode: e.errorCode
            });
        }
    }
    
});

app.post('/reward-user', async function (req, res) {

    try {
        const result = accountFunctions.transferFromAdminTo(req.body, usersCollection);
        res.status(200);
        res.send(result);

    } catch (error) {
        console.error('Error in make-payment:', error);
        res.status(500).json({ error: error.message });
    }

});

app.listen(port, () => {
    console.log(`Diamante backend listening at http://localhost:${port}`);
});
