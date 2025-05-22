import { useState, useEffect } from "react";
import axios from "axios";

const OnlineUsers = () => {
    const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'http://172.20.10.3:5173';
    const [onlineUsers, setOnlineUsers] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOnlineUsers = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/users/online`);
                
                if (Array.isArray(response.data)) {
                    setOnlineUsers(response.data);
                } else {
                    setOnlineUsers([]);
                }
            } catch (err) {
                setError("Failed to fetch online users");
            } finally {
                setLoading(false);
            }
        };

        fetchOnlineUsers();
        const interval = setInterval(fetchOnlineUsers, 5000); 

        return () => clearInterval(interval);
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h3>Online Users</h3>
            {onlineUsers.length === 0 ? (
                <p>No users online</p>
            ) : (
                <ul>
                    {onlineUsers.map((user) => (
                        <li key={user.id}>
                            <img src={user.profile_pic} alt={user.name} width="40" height="40" />
                            {user.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default OnlineUsers;
