import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Download as DownloadIcon, Shield, Clock, Code } from "lucide-react";

export default function Download() {
    const [downloadStarted, setDownloadStarted] = useState(false);
    const fileName = "VAIL.exe";
    const fileSize = "30.5 MB";

    useEffect(() => {
        const timer = setTimeout(() => {
            handleDownload();
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    const handleDownload = () => {
        setDownloadStarted(true);
        const downloadUrl = `https://github.com/SuppliedOrange/VAIL/releases/download/v.1.0.1/VAIL.exe`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <Header title="VAIL"/>
            <div className="mt-16 flex w-full flex-col items-center px-4 sm:mt-24">
                <h1 className="text-center text-2xl font-semibold tracking-tight text-gray-900 sm:text-2xl md:text-4xl">
                    <span className="block">Get our official Instalock Monitor</span>
                </h1>
                
                <p className="max-w-2xl py-5 text-center text-gray-600 sm:text-lg">
                    Our program helps monitor your VALORANT game and rewards you when you don't instalock an agent. The code for this program is completely open-source and won't interfere with VANGUARD.
                </p>

                <div className="relative mb-8">
                    <img 
                        src="./vail-app-preview.png" 
                        alt="Instalock Monitor Preview"
                    />
                </div>

                {downloadStarted && (
                    <div className="mb-6 w-full max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                        Your download should start automatically. If it doesn't, click the manual download button below.
                    </div>
                )}
                <button
                    onClick={handleDownload}
                    className="mb-8 flex items-center gap-2 rounded-lg bg-red-500 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                >
                    <DownloadIcon className="size-5" />
                    Download Manually ({fileSize})
                </button>

                <div className="mb-12 grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
                    <div className="flex flex-col items-center rounded-lg bg-gray-50 p-6 text-center">
                        <Shield className="mb-3 size-8 text-red-600" />
                        <h3 className="mb-2 font-medium">No Bans</h3>
                        <p className="text-sm text-gray-600">Works separately from the game by utizilizing the VALORANT API.</p>
                    </div>

                    <div className="flex flex-col items-center rounded-lg bg-gray-50 p-6 text-center">
                        <Clock className="mb-3 size-8 text-red-600" />
                        <h3 className="mb-2 font-medium">Easy To Use</h3>
                        <p className="text-sm text-gray-600">Sits in your system tray when inactive, and you can choose to disable at any time.</p>
                    </div>

                    <div className="flex flex-col items-center rounded-lg bg-gray-50 p-6 text-center">
                        <Code className="mb-3 size-8 text-red-600" />
                        <h3 className="mb-2 font-medium">Open Source</h3>
                        <p className="text-sm text-gray-600">Full transparency with our open-source codebase</p>
                    </div>
                </div>

                <div className="mb-12 w-full max-w-2xl rounded-lg bg-gray-50 p-6">
                    <h3 className="mb-4 font-medium">System Requirements</h3>
                    <ul className="space-y-2 text-gray-600">
                        <li>• Windows 10/11 (64-bit)</li>
                    </ul>
                </div>
            </div>
            <Footer />
        </>
    );
}