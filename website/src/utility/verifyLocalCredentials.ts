import axios from "axios";

export default async function verifyLocalCredentials() {

    // See if the user has good credentials in local storage

    const username = localStorage.getItem("username");
    const accessToken = localStorage.getItem("accessToken");

    if (username && accessToken) {

        // Validate the values in localStorage

        try {
            const loginResponse = await axios.post(import.meta.env.VITE_WEBSERVER_ENDPOINT + "/verify-authentication", {
                username: localStorage.getItem("username"),
                accessToken: localStorage.getItem("accessToken"),
            });

            if (loginResponse.status === 200) {
                return loginResponse.data;
            }
            
            else if (loginResponse.status === 401) {
                // Clear localStorage if the values are invalid
                localStorage.removeItem("username");
                localStorage.removeItem("accessToken");
                return false;
            }

            else return false;
        }

        catch (e) {
            console.error(e);
            return false;
        }

    }

}