import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { configDotenv } from "dotenv";
import { MongoClient } from 'mongodb';
import * as accountFunctions from './accountFunctions';
import * as errors from "./Errors";
import sha256 from 'sha256';
import analyzePregame from './pregameChecker';
import User from './User';
import winston from 'winston';
import { PregameMatch } from './PregameMatch';

// Configure dotenv
configDotenv({ path: ".env" });

// Configure winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, label, timestamp }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console({}),
        new winston.transports.File({ filename: 'webserver.log', options: {  } })
    ]
});

// Create a mongodb client
logger.info('Initializing MongoDB client with URI', { uri: process.env.MONGODB_URI });
const client = new MongoClient(process.env.MONGODB_URI as string);
const database = client.db("diam");
const usersCollection = database.collection("users");
const pregameMatchesCollection = database.collection("pregameMatches");
const transactionCollection = database.collection("transactions");

// Create the express server
const app = express();
const port = 3001;
app.use(bodyParser.json());
app.use(cors());

// @ts-expect-error unsure why this happens
app.post('/create-account', async function (req, res) {

    logger.info('Received request to create an account', { endpoint: '/create-account', body: req.body });

    if (!req.body.username || !req.body.password || !req.body.email || !req.body.type) {
        res.status(400);
        return res.send({ error: "Malformed request" });
    }

    const { username, password, email, type } = req.body;

    for (const credential of [username, password, email, type]) {
        if (typeof credential !== 'string' || credential.length < 1) {
            res.status(400);
            return res.send({ error: `Expected "${credential}" to be a string` });
        }
    }

    const lowerCaseUsername = username.toLowerCase();
    const encoded_password = sha256(lowerCaseUsername + password);

    try {
        const accountDetails = await accountFunctions.createAccount({
            username: lowerCaseUsername,
            encoded_password,
            email,
            type,
            diamClaimable: 0
        }, usersCollection);

        res.status(200).send(accountDetails);
    } catch (e) {
        logger.error('Error creating account', { error: e });
        if (e instanceof errors.BaseError) {
            res.status(e.errorCode).send({
                name: e.name,
                error: e.message,
                cause: e.cause,
                errorCode: e.errorCode
            });
        }
    }
});

app.post('/verify-authentication', async function (req, res) {

    logger.info('Received request to verify authentication', { endpoint: '/verify-authentication', body: req.body });

    if (!req.body.username || !req.body.accessToken) {
        res.status(400).send({ error: "Malformed request" });
        return;
    }

    const { username, accessToken } = req.body;
    const lowerCaseUsername = username.toLowerCase();

    try {
        const details = await accountFunctions.verifyAuthentication({
            username: lowerCaseUsername,
            encoded_password: accessToken
        }, usersCollection);

        res.status(200).send(details);
    } catch (error) {
        logger.error('Error verifying authentication', { error });
        if (error instanceof errors.BaseError) {
            res.status(error.errorCode).send({
                name: error.name,
                error: error.message,
                cause: error.cause,
                errorCode: error.errorCode
            });
        } else {
            res.status(500).send({ error: "Internal server error", cause: error });
        }
    }
});

app.post('/check-pregame', async function (req, res) {

    logger.info('Received request to check pregame', { endpoint: '/check-pregame', body: req.body });

    if (!req.body.username || !req.body.accessToken) {
        res.status(400).send({ error: "Malformed request\nRequired properties: username, accessToken" });
        return;
    }

    const { username, accessToken, endpoint, clientPlatform, clientVersion, entitlementsJWT, authToken, matchID, playerID } = req.body;
    const lowerCaseUsername = username.toLowerCase();

    try {

        await accountFunctions.verifyAuthentication({ username: lowerCaseUsername, encoded_password: accessToken }, usersCollection);

    } catch (error) {

        logger.error('Authentication error in check-pregame', { error });

        if (error instanceof errors.BaseError) {
            res.status(error.errorCode).send({
                name: error.name,
                error: error.message,
                cause: error.cause,
                errorCode: error.errorCode
            });

        } else {

            res.status(500).send({ error: "Internal server error", cause: error });

        }

        return;
    }

    const match = await pregameMatchesCollection.findOne({ matchID, lowerCaseUsername });

    if (match) {
        res.status(400).send({ error: "Match already checked" });
        return;
    }

    try {
        
        analyzePregame({
            endpoint,
            clientPlatform,
            clientVersion,
            entitlementsJWT,
            authorization: authToken,
            username: lowerCaseUsername,
            matchID,
            playerID,
            usersCollection,
            pregameMatchesCollection
        });

        res.status(200).send({ success: true });

    } catch (error) {
        logger.error('Error in check-pregame', { error });
        res.status(500).send({ error: error.message });
    }
});

app.post('/login', async function (req, res) {
    logger.info('Received request for login', { endpoint: '/login', body: req.body });

    if (!req.body.username || !req.body.password) {
        res.status(400).send({ error: "Malformed request" });
        return;
    }

    const { username, password } = req.body;
    const lowerCaseUsername = username.toLowerCase();
    const encoded_password = sha256(lowerCaseUsername + password);

    try {
        const accountDetails = await accountFunctions.loginAccount({ username: lowerCaseUsername, encoded_password }, usersCollection);
        res.status(200).send(accountDetails);
    } catch (e) {
        logger.error('Error in login', { error: e });
        if (e instanceof errors.BaseError) {
            res.status(e.errorCode).send({
                name: e.name,
                error: e.message,
                cause: e.cause,
                errorCode: e.errorCode
            });
        }
    }
});

// @ts-expect-error unsure why this happens
app.get('/get-balance', async function (req, res) {

    logger.info('Received request to get balance', { endpoint: '/get-balance' });

    if (!req.body.username || !req.body.accessToken) {
        res.status(400).send({ error: "Malformed request" });
        return;
    }

    const { username, accessToken } = req.body;
    const lowerCaseUsername = username.toLowerCase();

    try {

        await accountFunctions.verifyAuthentication({ username: lowerCaseUsername, encoded_password: accessToken }, usersCollection);

    } catch (error) {

        logger.error('Authentication error in get-balance', { error });

        if (error instanceof errors.BaseError) {
            return res.status(error.errorCode).send({
                name: error.name,
                error: error.message,
                cause: error.cause,
                errorCode: error.errorCode
            });

        } else {

            return res.status(500).send({ error: "Internal server error", cause: error });

        }
    }

    try {

        const user = await usersCollection.findOne<User>({ username: lowerCaseUsername });

        if (!user) {
            return res.status(404).send({ error: "User not found" });
        }

        const balanceRequest = await accountFunctions.getBalance(user);

        if (balanceRequest.error) {
            return res.status(500).send({ error: balanceRequest.error });
        }

        res.status(200).send({ balance: balanceRequest.balance });

    }

    catch (e) {
            
            logger.error('Error in get-balance', { error: e });
    
            if (e instanceof errors.BaseError) {
                return res.status(e.errorCode).send({
                    name: e.name,
                    error: e.message,
                    cause: e.cause,
                    errorCode: e.errorCode
                });
            }
    
            return res.status(500).send({ error: e.message });

    }


});

app.get('/check-admin-account', async function (req, res) {
    logger.info('Received request to check admin account', { endpoint: '/check-admin-account' });

    try {

        const response = await accountFunctions.checkAdmin(usersCollection);
        res.status(200).send(response);

    } catch (e) {

        logger.error('Error in check-admin-account', { error: e });

        if (e instanceof errors.BaseError) {
            res.status(e.errorCode).send({
                name: e.name,
                error: e.message,
                cause: e.cause,
                errorCode: e.errorCode
            });

        }
    }
});

// @ts-expect-error unsure why this happens
app.post('/get-matches-for-user', async function (req, res) {

    logger.info('Received request to get matches for user', { endpoint: '/get-matches-for-user', body: req.body });

    if (!req.body.username || !req.body.accessToken) {
        return res.status(400).send({ error: "Malformed request" });
    }

    const { username, accessToken } = req.body;
    const lowerCaseUsername = username.toLowerCase();

    try {

        await accountFunctions.verifyAuthentication({ username: lowerCaseUsername, encoded_password: accessToken }, usersCollection);

    } catch (error) {

        logger.error('Authentication error in get-matches-for-user', { error });

        if (error instanceof errors.BaseError) {

            return res.status(error.errorCode)
            .send({
                name: error.name,
                error: error.message,
                cause: error.cause,
                errorCode: error.errorCode
            });
            
        } else {
            return res.status(500).send({ error: "Internal server error", cause: error });
        }
    }

    try {

        const matches = await pregameMatchesCollection.find<PregameMatch>({ username: lowerCaseUsername }).toArray();
        return res.status(200).send({ matches: matches });

    } catch (error) {

        logger.error('Error in get-matches-for-user', { error });
        return res.status(500).send({ error: error.message });

    }

});

app.post('/reward-user', async function (req, res) {
    logger.info('Received request to reward user', { endpoint: '/reward-user', body: req.body });

    const { toUser: toUsername } = req.body;
    const lowerCaseUsername = toUsername.toLowerCase();

    if (!toUsername) {
        res.status(400).send({ error: "Malformed request" });
        return;
    }

    try {
        const toUser = await usersCollection.findOne<User>({ username: lowerCaseUsername });
        if (!toUser) {
            res.status(404).send({ error: "User not found" });
            return;
        }

        const result = await accountFunctions.transferFromAdminTo(toUser, usersCollection, transactionCollection);
        res.status(200).send(result);

    } catch (error) {

        logger.error('Error in reward-user', { error });

        if (error instanceof errors.BaseError) {
            res.status(error.errorCode).send({
                name: error.name,
                error: error.message,
                cause: error.cause,
                errorCode: error.errorCode
            });
        }
        else {
            res.status(500).send({ error: "Internal server error", cause: error });
        }
    }
});

app.listen(port, () => {
    logger.info(`VAIL webserver listening at http://localhost:${port}`);
});
