import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import verifyLocalCredentials from "../utility/verifyLocalCredentials";

export default function Dashboard() {
    const [claimableBalance, setClaimableBalance] = useState(0);
    const [publicKey, setPublicKey] = useState("");
    const [matches, setMatches] = useState([]);
    const [toastMessage, setToastMessage] = useState("");
    const [isTestnet, setIsTestnet] = useState(false);

    useEffect(() => {
        async function fetchData() {

            try {

                // Fetch user data
                const userData = await verifyLocalCredentials();

                console.log(userData)

                if (!userData) {
                    window.location.href = "/login";
                    return;
                }

                if (userData.type == "testnet") {
                    setIsTestnet(true);
                    setPublicKey(userData.public_key);
                }

                const claimableBalance: number = userData.diamClaimable;
                setClaimableBalance(claimableBalance);

                

                // Fetch matches
                // const matchesResponse = await axios.get(import.meta.env.VITE_WEBSERVER_ENDPOINT + "/matches");
                // setMatches(matchesResponse.data.matches);

            } catch (err) {
                console.error(err);
            }
        }
        fetchData();
    }, []);

    async function handleClaimBalance() {
        try {
            await axios.post(import.meta.env.VITE_WEBSERVER_ENDPOINT + "/reward-user");
            // Refresh balance after claiming
            const updatedBalance = await axios.get(import.meta.env.VITE_WEBSERVER_ENDPOINT + "/balance");
            setClaimableBalance(updatedBalance.data.balance);
        } catch (error) {
            setToastMessage("Error: Unable to claim balance.");
        }
    }

    async function handleSavePublicKey() {
        try {
            await axios.post(import.meta.env.VITE_WEBSERVER_ENDPOINT + "/save-public-key", { publicKey });
            setToastMessage("Public key saved successfully.");
        } catch (error) {
            setToastMessage("Error: Unable to save public key.");
        }
    }

    return (

        <>

        <Header title="VAIL" />

        <main className="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>

            {/* Claimable Balance Card */}
            <div className="mt-6 p-6 max-w-md bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800">Claimable Balance</h2>
                <p className="text-lg text-gray-700">${claimableBalance.toFixed(4)}</p>
                <button
                    onClick={handleClaimBalance}
                    className="mt-4 w-full rounded-md bg-red-500 px-4 py-2 text-white font-medium hover:bg-red-600"
                >
                    Claim Balance
                </button>
                {toastMessage && (
                    <div className="mt-2 rounded-md bg-red-50 p-4 text-red-800 shadow">
                        <p>{toastMessage}</p>
                    </div>
                )}
            </div>

            {/* My Public Key Section */}
            <div className="mt-6 p-6 max-w-md bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800">My Public Key</h2>
                <input
                    type="text"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    disabled={isTestnet}
                    placeholder="Enter your public key"
                    className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                    onClick={handleSavePublicKey}
                    disabled={isTestnet}
                    className={`mt-4 w-full rounded-md px-4 py-2 font-medium ${
                        isTestnet ? "bg-gray-300 text-gray-500" : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                >
                    Save Public Key
                </button>
                {isTestnet && <p className="mt-2 text-sm text-gray-500">Testnet detected, public key cannot be modified.</p>}
            </div>

            {/* Matches List */}
            <div className="mt-6 p-6 max-w-md bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800">Match History</h2>
                <ul className="mt-4 space-y-4">
                    {matches.map((match) => (
                        <li key={match.id} className="p-4 bg-gray-50 rounded-md shadow-sm">
                            <p className="text-sm text-gray-500">Time: {new Date(match.time * 1000).toLocaleString()}</p>
                            <p className="text-sm text-gray-800">Match ID: {match.id || "Unknown"}</p>
                            <p className="text-sm text-gray-800">Net Profit: ${match.netProfit || "Unknown"}</p>
                            <p className={`text-sm ${match.resolutionStatus === "win" ? "text-green-500" : "text-red-500"}`}>
                                Resolution: {match.resolutionStatus || "Unknown"}
                            </p>
                        </li>   
                    ))}
                </ul>
            </div>
        </main>

        <Footer />
        </>
    );
}
