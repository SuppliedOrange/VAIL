# VAIL webserver

## Running the webserver
Run `npx tsx index.ts`

(npx comes bundled with npm, it's not an external dependency)

## Modify .env values
```
MONGODB_URI="" # The mongodb URI for your database. You can make one for free on mongo atlas.
ADMIN_ACCOUNT_USERNAME="admin" # Checks if this account exists, otherwise creates & funds it with test money. If on mainnet, errors if account does not exist or does not have minimum threshold balance.
ADMIN_ACCOUNT_MINIMUM_THRESHOLD="25" # The minimum amount of money the admin account must possess.
```
Note that if intend to run on mainnet, the admin account must be created with mainnet.
You can do so by changing the website's .env file to mainnet, which will then query responses to the mainnet instead of testnet, but this feature is largely untested.
