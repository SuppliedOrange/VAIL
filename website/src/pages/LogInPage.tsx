import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axios from "axios";
import verifyLocalCredentials from "../apiOperations/verifyLocalCredentials";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(""); // State to handle server errors
    const [showTooltip, setShowTooltip] = useState(false); // State to handle tooltip visibility
    const [isLoading, setIsLoading] = useState(false); // track loading state

    useEffect(() => {
        verifyLocalCredentials().then((isLoggedIn) => {
            if (isLoggedIn) {
                window.location.href = "/dashboard";
            }
        });
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(""); // Clear previous errors
        setIsLoading(true); // Set loading state to true

        try {
            const response = await axios.post(import.meta.env.VITE_WEBSERVER_ENDPOINT + "/login", {
                username,
                password,
                type: import.meta.env.VITE_DIAMNET_MODE
            });

            if (response.status === 200) {
                localStorage.setItem("username", username);
                localStorage.setItem("accessToken", response.data.accessToken);
                window.location.href = "/";
            }
        } catch (err) {
            console.log(err)
            if (axios.isAxiosError(err) && err.response && err.response.data.error) {
                setError(`[${err.response.data.errorCode}] ${err.response.data.error}` || "An error occurred during login.");
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        }
        finally {
            setIsLoading(false); // Set loading state to false
        }
    }

    return (
        <>
        <Header title="VAIL"/>

        <main className="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
                <h1 className="text-8xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-9xl">
                    <span className="block">LOG IN</span>
                </h1>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
                        {/* Toast */}
                        {error && (
                            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800 shadow">
                                <p>{error}</p>
                            </div>
                        )}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            <div className="relative mt-2 text-sm text-gray-500">
                                <button
                                    type="button"
                                    onMouseEnter={() => setShowTooltip(true)}
                                    onMouseLeave={() => setShowTooltip(false)}
                                    className="text-red-600 hover:underline"
                                >
                                    Forgot Password?
                                </button>
                                {showTooltip && (
                                    <div className="absolute left-0 mt-2 w-48 rounded-md bg-gray-800 p-2 text-white shadow-lg">
                                        This feature isn't implemented yet.
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="flex w-full items-center justify-center rounded-md border border-transparent bg-red-500 px-8 py-3 text-base font-medium text-white hover:bg-red-600 md:px-10 md:py-4 md:text-lg"
                        >
                                                        {isLoading ? (
                                <div className="flex items-center">
                                    <svg className="mr-2 size-5 animate-spin text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Logging In...</span>
                                </div>
                            ) : (
                                "Log In"
                            )}
                        </button>
                        {/* Toast notification */}
                        {isLoading && (
                            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800 shadow">
                                <p>Logging in, please wait</p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </main>

        <Footer/>
        </>
    );
}