import { useEffect } from "react";

export default function Logout() {
    useEffect(() => {
        // Clear local storage credentials
        localStorage.removeItem("username");
        localStorage.removeItem("accessToken");

        // Redirect to home page
        window.location.href = "/";
    }, []);

    return null;
}