
export default function Lander () {

    function colourFirstLetter(text: string, color: string) { 

        return text.split('+').map((word, index) => (
            <span key={index}>
              <span className={`${color} font-semibold  `}>{word[0]}</span>
              {word.slice(1)}
            </span>
          ));
    
    }

    return (

        <main className="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
                <h1 className="text-8xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-9xl">
                    <span className="block">VAIL</span>
                </h1>
                <p className="mt-3 text-base text-gray-700 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0">
                    The {colourFirstLetter("VALORANT +Anti-+Insta+Lock", "text-red-500")} Project
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                        <a
                            href="/login"
                            className={`flex w-full items-center justify-center rounded-md border border-transparent px-8 py-3 text-base font-medium md:px-10 md:py-4 md:text-lg`}
                        >
                            Get started
                        </a>
                    </div>
                    <div className="mt-3 sm:ml-3 sm:mt-0">
                        <a
                            href="#"
                            className={`flex w-full items-center justify-center rounded-md border border-transparent px-8 py-3 text-base font-medium md:px-10 md:py-4 md:text-lg`}
                        >
                            <svg className="mx-2 size-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path fill="currentColor" fillRule="evenodd" d="M3.005 12 3 6.408l6.8-.923v6.517H3.005ZM11 5.32 19.997 4v8H11V5.32ZM20.067 13l-.069 8-9.065-1.275L11 13h9.067ZM9.8 19.58l-6.795-.931V13H9.8v6.58Z" clipRule="evenodd"/>
                            </svg>
                            Download
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
};