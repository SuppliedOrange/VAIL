import LazyShow from "./LazyShow";

export default function Tutorial() {
    const steps = [
        {
            title: "Sign Up",
            description: "Create your account to start earning DIAM tokens. Link your VALORANT account and set up your wallet in minutes.",
            imageUrl: "./water-puddle-2.png",
            tip: "Currently, public keys are auto-assigned since all accounts are on the testnet. The mainnet version is functional on the backend, but is unpublished"
        },
        {
            title: "Install the App",
            description: "Download our lightweight desktop application. Our open-source software won't trigger VANGUARD as it doesn't inject into your game.",
            imageUrl: "./vail-app-preview.png",
        },
        {
            title: "Keep the App Running",
            description: "Launch the app before you start playing VALORANT. It will automatically minimize to your system tray.",
            imageUrl: "./enabling-app.gif", 
        },
        {
            title: "Don't Instalock Agents",
            description: "Our app analyzes your agent selection behavior and rewards considerate team play. Patience and consideration!",
            imageUrl: "./jett-drawing.gif",
        },
        {
            title: "Automatic Game Analysis",
            description: "All your games are analyzed in real-time on the server-side. This ensures that our system is secure and tamper-proof.",
            imageUrl: "./dashboard.gif",
        },
        {
            title: "Claim Your Rewards",
            description: "Visit your dashboard to see your earned DIAM tokens. Claim rewards for games where you demonstrated team-first behavior.",
            imageUrl: "./claimguide.png",
            tip: "Transactions are currently only on the testnet, so they may hit undocumented errors. Don't stress if your redeem fails!"
        },
        {
            title: "Build a Better Ecosystem",
            description: "Join our community of players committed to improving the VALORANT experience. Your participation helps create a more collaborative gaming environment.",
            imageUrl: "./valorant-heart.gif",
        }
    ];

    function renderTip(tip: string | undefined) {

        if (!tip) {
            return <></>
        }

        return (
            <div className="mt-6 rounded-lg border border-l-4 border-l-amber-400 bg-white p-6 shadow-sm">
            <div className="flex items-center">
                <svg className="size-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 font-medium">Note</span>
            </div>
            <p className="mt-2 text-gray-600">
                {tip}
            </p>
        </div>
        )

    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:pt-60 lg:px-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    How to Get Started
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-xl text-gray-500 sm:mt-4">
                    Follow these simple steps to start earning rewards for being a team player
                </p>
            </div>

            <div className="mt-16 space-y-24">
                {steps.map((step, index) => (
                    <LazyShow>
                    <div key={index} className={`flex flex-col items-center gap-8 lg:flex-row ${
                        index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                    }`}>
                        {/* Image Container */}
                        <div className="w-full lg:w-1/2">
                            <div className="overflow-hidden rounded-lg">
                                <img
                                    src={step.imageUrl}
                                    alt={`Tutorial step ${index + 1}: ${step.title}`}
                                    className="size-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Render content */}
                        <div className="w-full lg:w-1/2">
                            <div className="flex h-full flex-col justify-center">
                                <div className="flex items-center">
                                    <span className="flex size-12 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-600">
                                        {index + 1}
                                    </span>
                                    <h3 className="ml-4 text-2xl font-bold text-gray-900">
                                        {step.title}
                                    </h3>
                                </div>
                                
                                <p className="mt-4 text-lg text-gray-500">
                                    {step.description}
                                </p>

                                {/* Render tip */}
                                {renderTip(step.tip)}
                            </div>
                        </div>
                    </div>
                    </LazyShow>
                ))}
            </div>

            {/* Redirect to FAQ? idk */}
            <div className="mt-24 text-center">
                <h3 className="text-2xl font-bold text-gray-900">
                    Questions? Hit us up
                </h3>
                <div className="mt-8 flex justify-center">
                    <a
                        href="mailto:blackandantiqual@gmail.com"
                        className="rounded-md px-8 py-3 text-base font-medium text-red-600 outline outline-red-600 hover:bg-red-700 hover:text-white"
                    >
                        blackandantiqual@gmail.com
                    </a>
                </div>
            </div>
        </div>
    );
};