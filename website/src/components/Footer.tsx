
export default function Footer() {
    return <>

        <footer className="mt-14 bg-white sm:mt-20">

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

                {/* Hackathon Banner */}
                <div className="rounded-xl bg-gradient-to-r from-red-500 to-rose-600 p-6 text-center shadow-lg">
                    <div className="flex flex-col items-center justify-center space-y-3 text-white">
                        <div className="text-sm font-medium uppercase tracking-wide">
                            Built during
                        </div>
                        <div className="text-2xl font-bold">
                            Diamante DevHub Hackathon
                        </div>
                        <a 
                            href="https://www.diamante.io/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full bg-white px-4 py-1 text-sm font-medium text-red-600 hover:bg-gray-50"
                        >
                            Learn More
                            <svg className="ml-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Scam notification */}
                <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-red-800">
                            Diamante scammed us, and I don't blame them.
                        </h3>
                        <p className="mt-2 text-sm text-red-700">
                            Do you wanna read about why this website went to waste and my opinions on it?
                        </p>
                        <a 
                            href="/scam" 
                            className="mt-3 inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                        >
                            Read More
                            <svg className="ml-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                </div>

                <div className="mt-12 grid grid-cols-2 gap-8 xl:grid-cols-4">
                    <div className="md:grid md:grid-cols-2 md:gap-8">
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Product
                            </h3>
                            <ul className="mt-4 space-y-4">
                                <li>
                                    <a href="/download" className="text-base text-gray-500 hover:text-gray-900">
                                        Download
                                    </a>
                                </li>
                                <li>
                                    <a href="https://github.com/SuppliedOrange/VAIL" className="text-base text-gray-500 hover:text-gray-900">
                                        Github
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div className="mt-12 md:mt-0">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Contact
                            </h3>
                            <ul className="mt-4 space-y-4">
                                <li>
                                    <a href="mailto:blackandantiqual@gmail.com" className="text-base text-gray-500 hover:text-gray-900">
                                        Email
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="w-fit">
                        <div className="mt-12 md:mt-0">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                                Legal
                            </h3>
                            <ul className="mt-4 space-y-4">
                                <p>
                                    This project is not affiliated with Riot Games, Inc. VALORANT is a registered trademark of Riot Games, Inc.
                                </p>
                                <p>
                                    This project is covered under the <a href="https://opensource.org/licenses/MIT" className="text-red-600 hover:underline">MIT License</a> and the developer(s) and the product itself is not responsible for any consequence of its use.
                                </p>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-12 border-t border-gray-200 pt-8">
                    <p className="text-center text-base text-gray-400">
                        The VAIL Project. MIT License ({new Date().getFullYear()})
                    </p>
                </div>
            </div>
            <div className="h-80">
            </div>
        </footer>
    </>
}