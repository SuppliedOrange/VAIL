import Header from "../components/Header";
import Lander from "../components/Lander";
import LanderImage from "../components/LanderImage";
import LazyShow from "../components/LazyShow";
import Footer from "../components/Footer";
import Tutorial from "../components/Tutorial";

export default function LanderPage() {
    return <>

        <LazyShow>
            <Header/>
            <Lander/>
            <LanderImage/>
        </LazyShow>
        <LazyShow>
            <Tutorial/>
        </LazyShow>
        <Footer/>
    </>;
};