import { Collection, Document } from "mongodb";
import { Asset, Keypair, Networks, Operation, TransactionBuilder } from 'diamante-base';
import { Aurora } from "diamnet-sdk";
import { Horizon } from "diamante-sdk-js";
import User from "./User";
import * as errors from "./Errors";

// Create an aurora server
const mainnet_server_aurora = new Aurora.Server("https://mainnet.diamcircle.io/");
const testnet_server_aurora = new Aurora.Server("https://diamtestnet.diamcircle.io/");

// Create a horizon server
const mainnet_server_horizon = new Horizon.Server("https://mainnet.diamcircle.io/");
const testnet_server_horizon = new Horizon.Server("https://diamtestnet.diamcircle.io/");

export async function verifyAuthentication(properties: Pick<User, "username" | "encoded_password">, usersCollection: Collection<Document>) {

    try {

        console.log('Received request to verify authentication');

        const user = await usersCollection.findOne<User>(properties);

        if (!user) {
            throw new errors.UserError(null, "Username or Password is incorrect");
        }

        return {
            success: true,
            public_key: user.public_key || "",
            username: properties.username,
            type: user.type,
            email: user.email,
            diamClaimable: user.diamClaimable,
        }
    }

    catch (e) {
        if (e instanceof errors.BaseError) {
            throw e;
        }
        else throw new errors.InternalServerError(e, "Internal server error");
    }

}

export async function createAccount(properties: Omit<User, "public_key" | "private_key">, usersCollection: Collection<Document>) {

    try {

        console.log('Received request to create an account');

        // Ensure username and email is not taken
        const similarAccounts = await usersCollection.findOne(
            {"$or": [
                {"username": properties.username}, 
                {"email": properties.email}]
            }
        );
        if (similarAccounts) {
            throw new errors.UserError(null, "Username or email already exists");
        }

        const user: User = {
            username: properties.username,
            encoded_password: properties.encoded_password,
            email: properties.email,
            type: properties.type,
            diamClaimable: 0
        }

        // Create a fake public/private key if they're on testnet.

        if (properties.type === "testnet") {

            const keypair = Keypair.random();
            const public_key = keypair.publicKey();
            const private_key = keypair.secret();

            user.public_key = public_key;
            user.private_key = private_key;

        }

        await usersCollection.insertOne(user)

        return {
            success: true,
            username: user.username,
            email: user.email,
            accessToken: user.encoded_password,
            public_key: user.public_key || "", // We'll make people bring in their own public keys?
        }

    }
    catch (e) {
        if (e instanceof errors.BaseError) {
            throw e;
        }
        else throw new errors.InternalServerError(e, "Internal server error");
    }
}

export async function updatePublicKey(properties: Pick<User, "username" | "encoded_password"> & { newPublicKey: string }, usersCollection: Collection<Document>) {

    try {

        console.log('Received request to update public key');

        const user = await usersCollection.findOne<User>({
            "username": properties.username,
            "encoded_password": properties.encoded_password
        });

        if (!user) {
            throw new errors.UserError(null, "Username or Password is incorrect");
        }

        await usersCollection.updateOne({"username": properties.username}, {$set: {"public_key": properties.newPublicKey}});

        return {
            success: true,
            public_key: properties.newPublicKey,
            username: properties.username,
            accessToken: properties.encoded_password
        }

    }

    catch (e) {
        if (e instanceof errors.BaseError) {
            throw e;
        }
        else throw new errors.InternalServerError(e, "Internal server error");
    }

}

export async function loginAccount(properties: Pick<User, "username" | "encoded_password">, usersCollection: Collection<Document>) {

    try {

        console.log('Received request to log in');

        const user = await usersCollection.findOne<User>({
            "username": properties.username,
            "encoded_password": properties.encoded_password
        });

        if (!user) {
            throw new errors.UserError(null, "Username or Password is incorrect");
        }

        return {
            success: true,
            public_key: user.public_key || "",
            username: properties.username,
            accessToken: properties.encoded_password
        }

    }

    catch (e) {
        if (e instanceof errors.BaseError) {
            throw e;
        }
        else throw new errors.InternalServerError(e, "Internal server error");
    }

}
/*
Verify an admin exists and has the necessary balance to perform operations.
If the account is on the testnet, generates private/public key if not already present.
If the account is on the mainnet, mandates that the account has a public/private key.
*/

export async function checkAdmin(usersCollection: Collection<Document>, sharePrivateKey: boolean = false) {
    try {
        // Verify that the admin account exists.
        const adminUsername = process.env.ADMIN_ACCOUNT_USERNAME as string;
        const adminAccountMinimumThreshold = parseFloat(process.env.ADMIN_ACCOUNT_MINIMUM_THRESHOLD as string);

        if (!adminUsername) {
            throw new errors.InternalServerError("Admin username could not be retrieved from environment variable!");
        }

        const adminAccounts = await usersCollection.find<User>({
            "username": adminUsername
        }).toArray();

        if (adminAccounts.length > 1) {
            throw new errors.InternalServerError("Two accounts exist with the same username while searching for the admin account!");
        }

        if (adminAccounts.length == 1) {
            const adminAccount: User = adminAccounts[0];

            // If the account is a part of the test server, check properties and fund with friendbot if necessary.
            if (adminAccount.type === "testnet") {
                if (adminAccount.public_key === undefined || adminAccount.private_key === undefined) {
                    console.log("Admin account does not have a public key. Generating one now.");

                    const randomKeypair = Keypair.random();
                    adminAccount.private_key = randomKeypair.secret();
                    adminAccount.public_key = randomKeypair.publicKey();

                    await usersCollection.updateOne({"username": adminUsername}, {$set: {"public_key": adminAccount.public_key, "private_key": adminAccount.private_key}});
                }

                let accountDetails: Awaited<Aurora.AccountResponse> | null | { "error": string } = null;
                accountDetails = await validateUserExistsOn(adminAccount, "testnet");

                if (!accountDetails || 'error' in accountDetails) {
                    if (accountDetails.error.includes("NO_BAL_ERROR")) {
                        const attemptFund = await fundWithFriendbot(adminAccount.public_key);
                        if (attemptFund.error) {
                            throw new errors.InternalServerError("Error while funding account", attemptFund.error);
                        }
                    }
                    throw new errors.InternalServerError("Error while loading account details", accountDetails.error);
                }

                // Get "native" balance. Native means DIAM ig?
                if (!accountDetails) {
                    throw new errors.InternalServerError("Failed to load account details.");
                }

                let needsBalanceRefill = false;
                const balanceResult = await getBalance(adminAccount);

                if (balanceResult.error || (balanceResult.balance !== undefined && balanceResult.balance < adminAccountMinimumThreshold)) {
                    if (balanceResult.error.includes("NO_BAL_ERROR")) {
                        needsBalanceRefill = true;
                    } else {
                        throw new errors.InternalServerError("Error while loading account details", balanceResult.error || "No error provided");
                    }
                }

                if (needsBalanceRefill) await fundWithFriendbot(adminAccount.public_key);

                // Account is good to go.
                return {
                    "balance": balanceResult.balance,
                    "username": adminAccount.username,
                    "email": adminAccount.email,
                    "type": adminAccount.type,
                    "public_key": adminAccount.public_key,
                    "private_key": sharePrivateKey ? adminAccount.private_key : "hidden",
                    "success": true
                };
            }

            // If the account is a part of the mainnet, make sure the account exists on the mainnet.
            // Check balance, error if too low.
            else if (adminAccount.type === "mainnet") {
                if (!adminAccount.public_key) {
                    throw new errors.UserError("Admin account does not have a public key with it, which is required for mainnet. [NO_PUBKEY_ERROR]");
                }
                if (!adminAccount.private_key) {
                    throw new errors.UserError("Admin account does not have a private key with it, which is required for mainnet. [NO_PRIVKEY_ERROR]");
                }

                let accountDetails: Awaited<Aurora.AccountResponse> | null | { "error": string } = null;
                accountDetails = await validateUserExistsOn(adminAccount, "mainnet");

                if (!accountDetails || 'error' in accountDetails) {
                    if (accountDetails.error.includes("NO_BAL_ERROR")) {
                        throw new errors.NoBalanceError("Account not found on the mainnet. Balance may be too low or information might be wrong. [NO_BAL_ERROR]");
                    }
                    throw new errors.InternalServerError(`Error while loading account details: ${accountDetails.error}`);
                }

                const balanceResult = await getBalance(adminAccount);
                if (balanceResult.balance === undefined || balanceResult.error) {
                    throw new errors.InternalServerError(`Error while loading account details: ${balanceResult.error || "No error provided."}`);
                }

                if (balanceResult.balance < adminAccountMinimumThreshold) {
                    throw new errors.NoBalanceError("Balance is too low. Please fund the account. [NO_BAL_ERROR]");
                }

                return {
                    "balance": balanceResult.balance,
                    "username": adminAccount.username,
                    "email": adminAccount.email,
                    "type": adminAccount.type,
                    "public_key": adminAccount.public_key,
                    "private_key": sharePrivateKey ? adminAccount.private_key : "hidden",
                    "success": true
                };
            }
        } else {
            throw new errors.InternalServerError("Something went wrong.");
        }
    } catch (e) {
        console.log(e);
        if (e instanceof errors.BaseError) {
            throw e;
        } else throw new errors.InternalServerError(`Internal server error: ${e}`);
    }
}

export async function validateUserExistsOn(user: User, mode: "testnet" | "mainnet") {

    if (!user.public_key) {
        return {"error": "User does not have a public key. [NO_PUBKEY_ERROR]"};
    }

    const server = mode === "testnet" ? testnet_server_aurora : mainnet_server_aurora;

    try {
        // Load account details from the server.
        const account = await server.loadAccount(user.public_key);
        return account;
    }
    catch (e) {

        if (e.response.status === 404) {
            return {"error": "Account not found on the mainnet. Balance may be too low or information might be wrong. [NO_BAL_ERROR]"};
        }
        else return {"error": `Error while loading account details: ${e}`};
    }

}

export async function fundWithFriendbot(publicKey: string, mode: "testnet" | "mainnet" = "testnet") {

    try {

        if (mode !== "testnet") {
            throw new Error("Friendbot is only available on the testnet.");
        }

        console.log(`Received request to fund account ${publicKey}`);

        const fetch = await import('node-fetch').then(mod => mod.default);
        const response = await fetch(`https://friendbot.diamcircle.io/?addr=${publicKey}`);

        if (!response.ok) {
            throw new Error(`Failed to activate account ${publicKey}: ${response.statusText}`);
        }
        
        const result = await response.json();

        console.log(`Account ${publicKey} activated`, result);
        return {"message": `Account ${publicKey} funded successfully`};

    } catch (error) {

        console.error('Error in fund-account:', error);
        return {"error": error.message};

    }

}

export async function getBalance(ofUser: User) {

    try {

        const server = ofUser.type === "testnet" ? testnet_server_aurora : mainnet_server_aurora;

        if (!ofUser.public_key) {
            throw new Error("User does not have a public key. [NO_PUBKEY_ERROR]");
        }

        console.log(`Received request to get balance for account ${ofUser.public_key}`);

        let accountDetails: Awaited<Aurora.AccountResponse> | null = null;

        try {
            accountDetails = await server.loadAccount(ofUser.public_key);
        }

        catch (e) {

            if (e.response.status === 404) {
                throw new Error(`Account not found on the ${ofUser.type}. Maybe it has no balance? [NO_BAL_ERROR]`);
            }

        }

        if (!accountDetails) throw new Error("Failed to load account details.");

        const balances = accountDetails.balances.filter((balance) => balance.asset_type === "native");

        if (!balances || balances.length < 1) {
            throw new Error("Failed to load account details.");
        }

        const balance = parseFloat(balances[0].balance);

        if (!balance || typeof balance !== "number") {
            throw new Error("Balance in account is not a number.");
        }

        console.log(`Balance for account ${ofUser.public_key} is ${balance}`);

        return {"balance": balance};

    } catch (error) {

        console.error('Error in get-balance:', error);
        return {"error": error.message};

    }

}

export async function transferFromAdminTo(toUser: User, usersCollection: Collection<Document>) {

    let hasReflectedInDatabase = false;

    try {   

        if (!toUser.public_key) throw new errors.ThirdPartyError("Recipient account does not have a public key.");

        if (!toUser.diamClaimable) throw new errors.UserError(null, "Recipient account does not have a claimable balance.");

        const adminAccount = await checkAdmin(usersCollection, true);

        if (!adminAccount) throw new errors.InternalServerError("Admin account could not be loaded.");

        const adminKeypair = Keypair.fromSecret(adminAccount.private_key);
        const adminPublicKey = adminKeypair.publicKey();

        if (toUser.type != adminAccount.type) {
            throw new errors.InternalServerError(`Attempted to transfer from ${adminAccount.type} to ${toUser.type}. You must use a ${toUser.type} admin account before doing this.`);
        }

        const server = toUser.type === "mainnet" ? mainnet_server_horizon : testnet_server_horizon;
        const networkPassphrase = toUser.type === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

        // Update database value with the user's updated claimable balance.
        usersCollection.updateOne({"username": toUser.username}, {$set: {"diamClaimable": 0}});
        hasReflectedInDatabase = true;
            
        const account = await server.loadAccount(adminPublicKey);

        const transaction = new TransactionBuilder(account, {
            fee: (await server.fetchBaseFee()).toString(),
            networkPassphrase: networkPassphrase,
        })
        .addOperation(Operation.payment({
            destination: toUser.public_key,
            asset: Asset.native(),
            amount: toUser.diamClaimable.toString(),
        }))
        .setTimeout(30)
        .build();

        transaction.sign(adminKeypair)
        
        const result = await testnet_server_horizon.submitTransaction(transaction);

        console.log(`Payment made from ${adminPublicKey} to ${toUser.public_key} with amount ${toUser.diamClaimable} DIAM`, result);

        return {
            "message": `Payment of ${toUser.diamClaimable} DIAM made to ${toUser.public_key} successfully`
        }

    }

    catch (e) {

        if (hasReflectedInDatabase) {
            usersCollection.updateOne({"username": toUser.username}, {$set: {"diamClaimable": toUser.diamClaimable}});
        }

        console.error('Error in transfer-from-admin-to:', e);
        throw new errors.InternalServerError(e, "Error while making payment from admin account.");

    }

}