import { useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000"; // Ensure this matches your backend port

const useOnlineStatus = (userId) => {
    useEffect(() => {
        let timeout = setTimeout(() => {
            axios.put("http://localhost:5000/api/users/set-offline", { userId });
        }, 300000); // 5 minutes
    
        const resetTimer = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                axios.put("http://localhost:5000/api/users/set-offline", { userId });
            }, 300000);
        };
    
        window.addEventListener("mousemove", resetTimer);
        window.addEventListener("keydown", resetTimer);
    
        return () => {
            clearTimeout(timeout);
            window.removeEventListener("mousemove", resetTimer);
            window.removeEventListener("keydown", resetTimer);
        };
    }, [userId]);
    
    useEffect(() => {
        if (!userId) return;

        const updateOnlineStatus = async () => {
            try {
                await axios.put(`${API_BASE_URL}/api/users/update-status`, { userId });
            } catch (error) {
                console.error("Failed to update online status:", error);
            }
        };

        const setOffline = async () => {
            try {
                await axios.put(`${API_BASE_URL}/api/users/set-offline`, { userId });
            } catch (error) {
                console.error("Failed to set user offline:", error);
            }
        };

        updateOnlineStatus();
        const interval = setInterval(updateOnlineStatus, 30000); // Update every 30 seconds

        window.addEventListener("beforeunload", setOffline);

        return () => {
            clearInterval(interval);
            window.removeEventListener("beforeunload", setOffline);
        };
    }, [userId]);
};

export default useOnlineStatus;
