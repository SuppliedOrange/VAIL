import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import verifyLocalCredentials from "../apiOperations/verifyLocalCredentials";
import getMatchesForUser from "../apiOperations/getMatchesForUser";
import { PregameMatch } from "../types/PregameMatch";
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import agentNames from "../resources/agentNames";
import rewardUser from "../apiOperations/rewardUser";

export default function Dashboard() {
    const [claimableBalance, setClaimableBalance] = useState(0);
    const [publicKey, setPublicKey] = useState("");
    const [matches, setMatches] = useState<PregameMatch[]>([]);
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
                const matches: null | PregameMatch[] = await getMatchesForUser();
                if (matches === null) {
                    setToastMessage("Error: Unable to fetch matches, perhaps our app hasn't seen you play!");
                    return;
                }
                matches.sort((a, b) => b.time - a.time);
                setMatches(matches);

            } catch (err) {
                console.error(err);
            }
        }

        fetchData();
    
    }, []);

    const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 5;
    
    // Format timestamp to readable date
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };
    
    // Format reward with 4 decimal places
    const formatReward = (reward: number) => {
        const rewardText = reward.toFixed(4);
        const rewardElement = <span className="font-medium">{rewardText}</span>;
        if (rewardText[0] === '-') {
            return <span className="text-red-500">{rewardElement}</span>;
        }
        else if (rewardText === '0.0000') {
            return <span className="text-gray-500">{rewardElement}</span>;
        }
        else return <span className="text-green-500">{rewardElement}</span>;
    };
    
    const getStatusColor = (didInstalock: string) => {
        switch (didInstalock) {
        case 'No':
            return 'text-green-600';
        case 'Yes':
            return 'text-red-600';
        default:
            return 'text-yellow-600';
        }
    };

    const loadMore = () => {
        setPage(prev => prev + 1);
      };

    function tryFindingLockedAgent( match: PregameMatch ) {

        // Find all checks that were successful
        const successfulChecks = match.checkResults.filter(check => check.success);
        if (!successfulChecks.length) return false;

        // Find the last successful check
        const lastCheck = successfulChecks[successfulChecks.length - 1];
        
        // Find the agent that was locked
        // Find the player object

        const teams = lastCheck.result.Teams as unknown[];
        if (!teams.length) return false;

        // There are two teams, find the team where teams.team.Players[x].Subject === match.playerID
        for (const team of teams) {

            const teamPlayers = (team as { Players: { Subject: string, CharacterID: string }[] }).Players;
            if (!teamPlayers.length) continue;

            const player = teamPlayers.find((player: { Subject: string, CharacterID: string }) => player.Subject === match.playerID);
            
            if (player) {
                const lockedCharacter = player.CharacterID;
                const agentName = agentNames[lockedCharacter] || false;
                return agentName;
            }

        }

        return false;
        
    }

    function tryFindingMatchType( match: PregameMatch ) {
        
        // Find all checks that were successful
        const successfulChecks = match.checkResults.filter(check => check.success);
        if (!successfulChecks.length) return false;

        // Find the first successful check
        const lastCheck = successfulChecks[0];

        // Find the match type
        const queueID = lastCheck.result.QueueID as string;
        if (!queueID || queueID === "null") return false;

        // Capitalize the queue ID
        const matchType = queueID.charAt(0).toUpperCase() + queueID.slice(1).toLowerCase();

        return matchType;
    }

    function tryFindingMatchMap( match: PregameMatch ) {

        // Find all checks that were successful
        const successfulChecks = match.checkResults.filter(check => check.success);
        if (!successfulChecks.length) return false;

        // Find the first successful check
        const lastCheck = successfulChecks[0];

        // Find the map ID
        const mapID = lastCheck.result.MapID as string;
        // Check if MapID is in the pattern of "/Game/Maps/<mapName>/<mapName>"
        if (!mapID || !mapID.startsWith("/Game/Maps/")) return false;
        if (mapID.split("/").length < 4) return false;

        // Extract the map name
        const mapName = mapID.split("/")[3];
        return mapName
        
    }

    async function handleClaimBalance() {
        try {
            const tryOperation = await rewardUser(localStorage.getItem("username") as string);

            if (tryOperation.error) {
                setToastMessage(tryOperation.error);
                return;
            }

            // See if operation returned 200
            if (tryOperation.status !== 200) {
                setToastMessage(`[${tryOperation.status}] ${tryOperation.statusText}`);
                return;
            }
            setClaimableBalance(0); 
        } catch (error) {

            if (axios.isAxiosError(error) && error.response && error.response.data.error) {
                setToastMessage(`[${error.response.status}] ${error.response.data.error}`);
            } else {
                setToastMessage("Error: Unable to claim balance.");
            }
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

            <div className="sm:text-center lg:text-left">
                <h1 className="text-6xl font-extrabold tracking-tight text-gray-900 sm:text-7xl md:text-8xl">
                    <span className="block">DASHBOARD</span>
                </h1>
            </div>
        
            {/* Claimable Balance Card */}

            <div className="flex flex-col md:flex-row ">

                <div className="mt-6 rounded-lg bg-white p-6 shadow-md md:mr-10 md:w-full">
                    <h2 className="text-xl font-semibold text-gray-800">Claimable Balance</h2>
                    <p className="text-lg text-gray-700">${claimableBalance.toFixed(4)}</p>
                    <button
                        onClick={handleClaimBalance}
                        className="mt-4 w-full rounded-md bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
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
                <div className="mt-6 rounded-lg bg-white p-6 shadow-md md:w-full">
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

            </div>

            {/* Matches List */}
            <div className="mt-6 rounded-lg bg-white p-6 shadow-md md:w-full">

            <h2 className="mb-4 text-xl font-semibold text-gray-800">Match History</h2>
                
            <div className="space-y-4">

                
                {matches?.slice(0, page * ITEMS_PER_PAGE).map((match) => (

                <div key={match.matchID} className="rounded-lg border p-4">

                    <div className="flex items-center justify-between">

                    <div className="space-y-1">

                        <div className="flex items-center space-x-2">

                            <span className="font-medium">{tryFindingLockedAgent(match) || "Unknown"}</span>

                            <span className="text-sm text-gray-500">
                                {formatDate(match.time)}
                            </span>
                        
                        </div>

                        <div className="flex items-center space-x-4">

                            <span className="text-sm text-gray-600">
                                Net Gain: $DIAM {formatReward(match.netReward)}
                            </span>

                            <span className={`text-sm ${getStatusColor(match.didInstalock)}`}>
                                Instalock: {match.didInstalock}
                            </span>

                        </div>

                    </div>

                    <button
                        onClick={() => setExpandedMatch(expandedMatch === match.matchID ? null : match.matchID)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        {expandedMatch === match.matchID ? (
                        <ChevronUp className="size-5" />
                        ) : (
                        <ChevronDown className="size-5" />
                        )}
                    </button>

                    </div>

                        {/* Enhanced Expanded Details */}
                        {expandedMatch === match.matchID && (
                            <div className="mt-4 space-y-3 border-t pt-3">
                                {/* Match Details Grid */}
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-gray-700">Match Details</h4>
                                        <div className="space-y-1 text-sm text-gray-600">
                                            <p>Map: {tryFindingMatchMap(match) || "Unknown"}</p>
                                            <p>Match Type: {tryFindingMatchType(match) || "Unknown"}</p>
                                            <p className="font-mono text-xs">Match ID: {match.matchID}</p>
                                            <p className="font-mono text-xs">Player ID: {match.playerID}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-gray-700">Statistics</h4>
                                        <div className="space-y-1 text-sm text-gray-600">
                                            <p>Times Checked: {match.timesChecked}</p>
                                            <p>Errors: {match.timesErrorOccurred}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Check Results */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700">Check Results:</h4>
                                    <div className="max-h-40 overflow-y-auto">
                                        {match.checkResults.map((check, index) => (
                                            <div 
                                                key={index}
                                                className={`rounded p-2 text-sm ${
                                                    check.success ? 'bg-green-50' : 'bg-red-50'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    {!check.success && (
                                                        <AlertCircle className="size-4 text-red-500" />
                                                    )}
                                                    <span>{formatDate(check.time)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                </div>
                ))}
            </div>

            {/* Load More Button */}
            {matches?.length > page * ITEMS_PER_PAGE && (
                <button
                onClick={loadMore}
                className="mt-4 w-full rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                >
                Load More
                </button>
            )}
            </div>

        </main>

        <Footer />
        </>
    );
}
