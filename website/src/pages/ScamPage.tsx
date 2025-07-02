import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ScamPage() {
    return (
        <>
            <Header />
            
            <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
                        The Indian Education System Sucks.
                    </h1>
                    <p className="mx-auto mt-6 max-w-3xl text-2xl leading-relaxed text-gray-600 sm:text-3xl">
                        Yes, you just stepped into a rant.
                    </p>
                </div>

                <div className="mt-20">
                    <article className="mx-auto max-w-4xl">
                        
                        {/* Section 1 */}
                        <section className="mb-16">
                            <h2 className="mb-8 text-3xl font-bold text-gray-900 sm:text-3xl">
                                The Setup
                            </h2>
                            <div className="space-y-8">
                                <p className="text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                    We were chilling in college, yeah? When we came across this cool looking poster.
                                </p>
                                
                                {/* Poster image */}
                                <div className="my-12 flex justify-center">
                                    <img
                                        src="/public/poster.jpg" 
                                        alt="The Diamante Hackathon Poster claiming a 1000 USDC reward" 
                                        className="w-full max-w-xs cursor-pointer rounded-lg shadow-lg transition-transform hover:scale-105 sm:max-w-sm" 
                                    />
                                </div>
                                
                                <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-800 sm:text-3xl">
                                            1000 USDC REWARD
                                        </p>
                                        <p className="mt-2 text-lg text-green-700">
                                            That's 1000 US dollars and a legit cryptocurrency<br />
                                            (and that means this crypto can be converted back into regular cash)
                                        </p>
                                    </div>
                                </div>
                                
                                <p className="text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                    We signed up for it, skeptical about winning.
                                </p>
                            </div>
                        </section>

                        {/* Section 2 */}
                        <section className="mb-16">
                            <h2 className="mb-8 text-3xl font-bold text-gray-900 sm:text-3xl">
                                Building Something Cool
                            </h2>
                            <div className="space-y-8">
                                <p className="text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                    They briefed us on a call, told us to make something cool using their cryptocurrency and we can maybe win it. Their API was quite nice. I felt confident.
                                </p>
                                
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                                    <h3 className="mb-3 text-xl font-semibold text-blue-800">My Project: VALORANT Anti-Instalocker</h3>
                                    <p className="text-blue-700">
                                        I had messed around with VALORANT before so I made a VALORANT anti-instalocker. Essentially, it scans your VALORANT games and detects if you've been instalocking. All without messing with your game since it was completely external.
                                    </p>
                                </div>
                                
                                <p className="text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                    I made this website and a webserver to handle the Diamante API and VALORANT API calls. My teammate made a tkinter app using claude, yeah granted its kinda sh*t but it worked.
                                </p>
                            </div>
                        </section>

                        {/* Section 3 */}
                        <section className="mb-16">
                            <h2 className="mb-8 text-3xl font-bold text-gray-900 sm:text-3xl">
                                The First Red Flag
                            </h2>
                            <div className="space-y-8">
                                <p className="text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                    Eventually, when we got to the briefing of the event, we had a head professor come up and give a speech about blockchain or whatever (he made it clear he doesn't understand it fully) and left the room. I was bored.
                                </p>
                                
                                <p className="text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                    Later, a kid came up. He was in his mid-20s, looked like a college kid. He was the sole representative of Diamante. He hyped crypto up and whatever other BS crypto kids do, and he told us we're getting...
                                </p>
                                
                                <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-red-800 sm:text-3xl">
                                            1000 DIAM!
                                        </p>
                                        <p className="mt-2 text-lg italic text-red-700">
                                            Wait what? Wasn't this supposed to be USDC?
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 4 */}
                        <section className="mb-16">
                            <h2 className="mb-8 text-3xl font-bold text-gray-900 sm:text-3xl">
                                Speaking Up (Big Mistake)
                            </h2>
                            <div className="space-y-8">
                                <p className="text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                    Confused, I sent a message in the event's whatsapp group asking about this discrepancy and if it can be converted into regular cash.
                                </p>
                                
                                <div className="space-y-8">
                                    <p className="text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                        Oh <b>BIG</b> mistake. I was confronted by the event organizers saying I was disrespecting the "cool" folks there and they'd disqualify me. I was so scared <i>(insert sarcasm)</i>.
                                    </p>
                                </div>
                                
                                <p className="text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                    Eventually, the organizer came up to me. He told me it's a great investment and it'll be worth hundreds of dollars in the future. Gee, didn't think I was in a gambling advertisement. Anyway, we went on to submit this website, app and server.
                                </p>
                            </div>
                        </section>

                        {/* Section 5 */}
                        <section className="mb-16">
                            <h2 className="mb-8 text-3xl font-bold text-gray-900 sm:text-3xl">
                                The Confidence Booster
                            </h2>
                            <div className="space-y-8">
                                <p className="text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                    Despite all the red flags, I was still pretty confident about winning. Why? Well, let me paint you a picture of the competition.
                                </p>
                                
                                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
                                    <p className="text-lg text-yellow-800">
                                        A sizeable portion of the other kids were first, second, or third years and they all looked completely lost. I'm talking deer-in-headlights kind of lost.
                                    </p>
                                </div>
                                
                                <p className="text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                    A good number of them probably couldn't tell you how to even access the Diamante API (because you have to read the docs 😱). A lot of them had ChatGPT open, waiting for it to 
                                    scanalyze the code.
                                </p>
                                
                                <p className="text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                    The confidence was real. I zipped through the docs, found their repositories, went through the code (they were in typescript! yay!) and based my code around their infrastructure. Their API was surprisingly well-documented.
                                </p>
                            </div>
                        </section>

                        {/* Section 6 */}
                        <section className="mb-16">
                            <h2 className="mb-8 text-3xl font-bold text-gray-900 sm:text-3xl">
                                The Anticlimax
                            </h2>

                            <p className="mb-10 text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                We hosted the website and set it up for evaluation! We put in some effort on this one. But here's the timeline.
                            </p>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-600">5 DAYS</div>
                                        <p className="text-gray-600">How long we took to build, test and submit</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-gray-600">15 DAYS</div>
                                        <p className="text-gray-600">How long our hosting lasted</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-red-600">17 DAYS</div>
                                        <p className="text-gray-600">How long we waited after they promised a week</p>
                                    </div>
                                </div>
                                
                                <p className="text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                    By that time, our hosting expired. We told them about it, they said "cool np". We lost. What did we lose to? You might laugh.
                                </p>
                                
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
                                    <p className="text-xl font-semibold text-gray-800">
                                        A shopping site... that you can buy stuff with... with crypto.
                                    </p>
                                    <p className="mt-2 italic text-gray-600">
                                        Yeah, well, I want to stay humble and say that my fully functional, scalable website got no fame.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 7 */}
                        <section className="mb-16">
                            <h2 className="mb-8 text-3xl font-bold text-gray-900 sm:text-3xl">
                                The Real Scam
                            </h2>
                            <div className="space-y-8">
                                <p className="text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                    It's no problem. I don't blame the crypto company at all. In fact, the influencer (or rep) left the company and started his own "Agents Clan" that build products for him in exchange for exposure and "future prospects" - Sound familiar?
                                </p>
                                
                                <div className="border-l-4 border-red-500 bg-red-50 p-6">
                                    <p className="mb-3 text-xl font-bold text-red-800">
                                        He's making a hustle, you know who else is making a hustle?
                                    </p>
                                    <p className="text-lg text-red-700">
                                        The college! They're making bank on us; the unemployed, unsuspecting kids that go to their college to mug up mathematics in the name of "computer science".
                                    </p>
                                </div>
                                
                                <p className="text-xl font-medium leading-relaxed text-gray-800 sm:text-2xl sm:leading-relaxed">
                                    This is the reality of this nation man, nobody gives a shit about you. You <em>need</em> to go to a college, you need to <em>get a job</em>, and then you can start scamming people, like this company.
                                </p>
                                
                                <p className="text-lg leading-relaxed text-gray-700 sm:text-xl sm:leading-relaxed">
                                    And people wonder why Indian Call Centers are a meme. It's because the country expects you to submit to it if you're poor. Education is a joke. You need to play dirty to survive in India. That's my take away from this scenario.
                                </p>
                                
                                <div className="mt-12 text-center">
                                    <p className="text-2xl font-bold italic text-gray-800">
                                        Thanks for listening.
                                    </p>
                                </div>
                            </div>
                        </section>

                    </article>

                    <div className="mt-12 text-center">
                        <a 
                            href="/"
                            className="inline-flex items-center rounded-md bg-red-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-red-500"
                        >
                            Back to Home
                            <svg className="ml-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}
