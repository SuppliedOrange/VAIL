import Header from "../components/Header";
import Lander from "../components/Lander";
import LanderImage from "../components/LanderImage";
import LazyShow from "../components/LazyShow";
import Footer from "../components/Footer";


export default function LanderPage() {
    return <>

        <LazyShow>
            <Header/>
            <Lander/>
            <LanderImage/>
        </LazyShow>
        <LazyShow>
            <div className="mt-16 flex w-full flex-col items-center sm:mt-24">
                <img src="./vail-app-preview.png" className="h-auto max-w-full"></img>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-2xl md:text-4xl">
                        <span className="block">Get our official Instalock Monitor</span>
                </h1>
                <p className=" w-1/2 py-5 text-center sm:text-lg ">
                    Our program helps monitor your VALORANT game and rewards you when you don't instalock an agent. The code for this program is completely open-source and won't interfere with VANGUARD.
                </p>
            </div>
        </LazyShow>
        <Footer/>
    </>;
};