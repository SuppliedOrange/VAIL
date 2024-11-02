import axios from 'axios';

const getMatchesForUser = async () => {
    try {
        const response = await axios.post(import.meta.env.VITE_WEBSERVER_ENDPOINT + "/get-matches-for-user", {
            username: localStorage.getItem("username"),
            accessToken: localStorage.getItem("accessToken")
        });

        return response.data.matches;
        
    } catch (error) {
        console.error('Error fetching matches for user:', error);
        return null;
    }
};

export default getMatchesForUser;