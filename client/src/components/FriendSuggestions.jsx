import { useEffect, useState } from "react";
import { Box, Avatar, Typography, Button, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'http://172.20.10.3:5173';
const FriendSuggestions = ({ currentUser, setSelectedChat }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Unauthorized: Please log in.");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/suggested-friends`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setFriends(response.data.friends); // API already excludes current user
        } else {
          setError("Failed to fetch users.");
        }
      } catch (err) {
        setError("Error fetching users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Navigate to message screen with selected user
//  const handleMessage = (friendId) => {
//    navigate(`/messages?user=${friendId}`); // Pass user ID as query param
//  };
const handleMessage = async (friend) => {
  console.log("Friend object:", friend); // Debugging log

  if (!friend || !friend.id) {
    console.error("Invalid friend object:", friend);
    return;
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found.");
      return;
    }

    const receiverId = friend.id;
    console.log("Sending message request to user ID:", receiverId);

    const response = await axios.post(
      `${API_BASE_URL}/conversations/start`,
      { receiver_id: receiverId }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const chat = response.data.conversation;

    if (!chat || !chat.id) {
      console.error("API response missing conversation ID:", chat);
      return;
    }

    if (typeof setSelectedChat === "function") {
      setSelectedChat({
        id: chat.id,
        user_id: receiverId,
        name: friend.name,
        profile_pic: friend.profile_pic || "/default-avatar.png",
        lastMessage: chat.last_message || "",  
        messages: [], 
      });
    }

    navigate(`/messages?user=${receiverId}`);
  } catch (error) {
    console.error("Error starting chat:", error.response?.data || error);
  }
};

  if (loading) return <CircularProgress />;
  if (error) return <Typography variant="body2" color="error">{error}</Typography>;
  if (!friends.length) return <Typography variant="body2" color="textSecondary">No users found.</Typography>;

  return (
    <Box>
      {friends.map((friend) => (
        <Box 
          key={friend.id} 
          sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, p: 2, borderRadius: 2, boxShadow: 1, bgcolor: "#05ff4405" }}
        >
          <Avatar src={friend.profile_pic} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{fontWeight:"light", fontSize :"16px"}} >{friend.name}</Typography>
          </Box>
          <Button 
            size="small" 
            variant="contained"  
            onClick={() => handleMessage(friend)}
            sx={{ mr:2, backgroundColor:'#44dd', boxShadow: 0 }}
          >
            Add
          </Button>
        </Box>
      ))}
    </Box>
  );
};

export default FriendSuggestions;
