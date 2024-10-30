import { useState } from 'react';

interface HeaderProperties {
    title?: string
}

export default function Header(properties: HeaderProperties) {

    // idk why data-collapse-toggle isnt working but this works as an alternative.
    const [isNavVisible, setIsNavVisible] = useState(false);

    const toggleNav = () => {
        setIsNavVisible(!isNavVisible);
    };

    return (
        <>
            <nav className="border-gray-200 bg-white dark:bg-gray-900">
                <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between p-4">
                    <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                        <img src="./logo.svg" className="mt-1 h-10 md:h-12" alt="Flowbite Logo" />
                        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                            {properties?.title || ""}
                        </h1>
                        <span className="self-center whitespace-nowrap text-2xl font-semibold dark:text-white"></span>
                    </a>
                    <button
                        data-collapse-toggle="navbar-default"
                        type="button"
                        className="inline-flex size-10 items-center justify-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 md:hidden"
                        aria-controls="navbar-default"
                        aria-expanded={isNavVisible}
                        onClick={toggleNav}
                    >
                        <span className="sr-only">Open main menu</span>
                        <svg className="size-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
                        </svg>
                    </button>
                    <div className={`w-full md:block md:w-auto ${isNavVisible ? '' : 'hidden'}`} id="navbar-default">
                        <ul className="mt-4 flex flex-col rounded-lg border border-gray-100 bg-gray-50 p-4 font-medium dark:border-gray-700 dark:bg-gray-800 md:mt-0 md:flex-row md:space-x-8 md:border-0 md:bg-white md:p-0 md:dark:bg-gray-900 rtl:space-x-reverse">
                            <li>
                                <a href="/signup" className="block rounded bg-red-500 px-3 py-2 text-white dark:text-white md:bg-transparent md:p-0 md:text-red-700 md:dark:text-red-500" aria-current="page">Sign Up</a>
                            </li>
                            <li>
                                <a href="/login" className="block rounded px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:p-0 md:hover:bg-transparent md:hover:text-red-700 md:dark:hover:bg-transparent md:dark:hover:text-red-500">Log In</a>
                            </li>
                            <li>
                                <a href="#" className="block rounded px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:p-0 md:hover:bg-transparent md:hover:text-red-700 md:dark:hover:bg-transparent md:dark:hover:text-red-500">About</a>
                            </li>
                            <li>
                                <a href="/dashboard" className="block rounded px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:p-0 md:hover:bg-transparent md:hover:text-red-700 md:dark:hover:bg-transparent md:dark:hover:text-red-500">Dashboard</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </>
    );
}