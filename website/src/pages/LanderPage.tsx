import Header from "../components/Header";
import Lander from "../components/Lander";
import LanderImage from "../components/LanderImage";
import LazyShow from "../components/LazyShow";
import Footer from "../components/Footer";
import Tutorial from "../components/Tutorial";

export default function LanderPage() {
    const scrollToFooter = () => {
        const footer = document.querySelector('footer');
        if (footer) {
            footer.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return <>
        <LazyShow>
            <Header/>
            <Lander/>
            <LanderImage/>
            
            {/* Scam notification message */}
            <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <div className="flex items-center">
                        <div className="shrink-0">
                            <svg className="size-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-800">
                                Hey, the company that hosted our hackathon scammed us. 
                                <button 
                                    onClick={scrollToFooter}
                                    className="ml-1 font-medium underline hover:text-yellow-900"
                                >
                                    Read about it down here
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </LazyShow>
        
        <LazyShow>
            <Tutorial/>
        </LazyShow>
        <Footer/>
    </>;
};