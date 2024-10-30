import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Login() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showTooltip, setShowTooltip] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        // Add login logic here
        console.log("Username:", username, "Password:", password);
    }

    return (
        <>

        <Header title="VAIL"/>

        <main className="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
                <h1 className="text-8xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-9xl">
                    <span className="block">LOG IN</span>
                </h1>
                <p className="mt-3 text-base text-gray-700 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0">
                    Access the {colourFirstLetter("VAIL  +Platform", "text-red-500")}
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
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
                            <div className="mt-2 text-sm text-gray-500">
                                <button
                                    type="button"
                                    onMouseEnter={() => setShowTooltip(true)}
                                    onMouseLeave={() => setShowTooltip(false)}
                                    className="text-red-600 hover:underline"
                                >
                                    Forgot Password?
                                </button>
                                {showTooltip && (
                                    <div className="relative mt-1">
                                        <div className="absolute z-10 w-48 rounded-md bg-gray-700 p-2 text-sm text-white shadow-lg">
                                            This feature isn't implemented yet.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="flex w-full items-center justify-center rounded-md border border-transparent bg-red-500 px-8 py-3 text-base font-medium text-white hover:bg-red-600 md:px-10 md:py-4 md:text-lg"
                        >
                            Log In
                        </button>
                    </form>
                </div>
            </div>
        </main>

        <Footer />

        </>
    );
}

function colourFirstLetter(text: string, color: string) {
    return text.split('+').map((word, index) => (
        <span key={index}>
            <span className={`${color} font-semibold`}>{word[0]}</span>
            {word.slice(1)}
        </span>
    ));
}