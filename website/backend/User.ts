export default interface User {
    username: string,
    encoded_password: string,
    email: string,
    type: "mainnet" | "testnet",
    diamClaimable: number,
    public_key?: string,
    private_key?: string,
}