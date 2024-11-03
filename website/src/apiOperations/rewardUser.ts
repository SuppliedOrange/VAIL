import axios from 'axios';

const rewardUser = async (toUser: string) => {
    try {
        const response = await axios.post(import.meta.env.VITE_WEBSERVER_ENDPOINT + "/reward-user", {
            toUser
        });
        return response.data.message;
        
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return { error: error.response.data.error };
        }
        else {
            console.error('Error rewarding user:', error);
            console.log(error)
            return { error: "An error occurred while rewarding the user." }
        }
    }
};

export default rewardUser;