import { useState, useEffect } from "react";
import { Box, Avatar, Typography, List, ListItem, ListItemAvatar, ListItemText, Divider, CircularProgress } from "@mui/material";
import { Done, DoneAll, ErrorOutline } from "@mui/icons-material";
import moment from "moment";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import FriendSuggestions from "./FriendSuggestions";

const API_BASE_URL = window.location.hostname === 'localhost'
? 'http://localhost:5000'
: 'http://172.20.10.3:5173';
  const ConversationsList = ({ conversations, setSelectedChat}) => {
  const [selected, setSelected] = useState(null);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
  
          console.log("User data fetched:", response.data);
          setUser(response.data);
        } catch (error) {
          console.error("Error fetching user data:", error);
          localStorage.removeItem("token"); // Clear invalid token
        }
      } else {
        console.warn("No token found in localStorage");
      }
    };
  
    fetchUser();
  }, []);

  // Fetch suggested friends from the backend
  useEffect(() => {
    const fetchSuggestedFriends = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found.");
          return;
        }
    
        const response = await axios.get(`${API_BASE_URL}/suggested-friends`, {
          headers: { Authorization: `Bearer ${token}` },
        });
    
        if (response.data.success) {
          setSuggestedFriends(response.data.friends || []);
        } else {
          console.error("Failed to fetch suggested friends:", response.data.error);
          setSuggestedFriends([]);
        }
      } catch (error) {
        console.error("Error fetching suggested friends:", error.response?.data || error);
        setSuggestedFriends([]); // Reset on error
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedFriends();
    const interval = setInterval(fetchSuggestedFriends, 500);
    return () => clearInterval(interval);
  }, []);
  

  // Navigate to messages with selected user
  const handleStartChat = async (friend) => {
    if (!friend || !friend.chat_partner_id ) {
      console.error("Invalid friend object:", friend);
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found.");
        return;
      }
  
      // Call API to check or create a conversation
      const response = await axios.post(
        `${API_BASE_URL}/conversations/start`,
        { receiver_id: friend.chat_partner_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      let chat = response.data.conversation;
  
      // Handle the case where conversation is null
      if (!chat) {
        console.warn("No conversation returned. Retrying...");
        
        await new Promise(resolve => setTimeout(resolve, 500));
  
        const retryResponse = await axios.post(
          `${API_BASE_URL}/conversations/start`,
          { receiver_id: friend.chat_partner_id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        chat = retryResponse.data.conversation;
  
        if (!chat) {
          console.error("Failed to retrieve conversation after retry:", retryResponse.data);
          return;
        }
      }
  
      if (!chat.id) {
        console.error("API response missing conversation ID:", chat);
        return;
      }
  
      setSelectedChat({
        id: chat.id,
        user_id: friend.chat_partner_id, 
        name: friend.chat_partner_name, 
        profile_pic: friend.profile_pic,
        lastMessage: chat.last_message || "",
        messages: [],
        is_online: friend.is_partner_online,
        last_seen: friend.last_seen,
      });
  
      navigate(`/messages?user=${friend.chat_partner_id}`); 
    } catch (error) {
      console.error("Error starting chat:", error.response?.data || error);
    }
  };
  
  const [friendSuggestions, setFriendSuggestions] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Fetch friend suggestions
    axios.get(`${API_BASE_URL}/suggested-friends`)
      .then((res) => setFriendSuggestions(res.data))
      .catch((err) => console.error("Error fetching friend suggestions:", err));
   }, [user]);
   
  return (
    <Box sx={{ width: "100%", maxHeight: "calc(100vh - 64px)", overflowY: "auto", overflowX: "hidden", p: 2 }}>

      {/* Conversations Section */}
      <Typography fontWeight="semi-bold" sx={{ mb: 1, fontSize:'large', color:'#222' }}>
        Messages
      </Typography>

<List>
  {Array.isArray(conversations) && conversations.length === 0 ? (
    <Typography sx={{ p: 2, textAlign: "left", color: "gray" }}>
      No messages yet. Invite friends to start chatting.
    </Typography>
  ) : (
    conversations.map((chat, index) => {
      const isLastMessageFromUser =  chat.last_message_sender_id === chat.current_user_id ;
      const showUnreadCount = !isLastMessageFromUser && chat.unread_count > 0;
      const showTick = isLastMessageFromUser;

      return (
        <Box key={chat.conversation_id}>
          <ListItem
            button
            onClick={() => handleStartChat(chat)}
            sx={{
              bgcolor: selected === chat.user2_id ? "#e3f2fd" : "#fff",
              "&:hover": { bgcolor: "#f5f5f5" },
              borderRadius: 2,
              position: "relative",
              p: "5px",
              pr:"10px",
              width: "100%",
              borderLeft: chat.is_partner_online ? "5px solid #44dd" : "5px solid #d00"
            }}
          >
            <ListItemAvatar>
              <Avatar src={chat.profile_pic || "/default-avatar.png"} />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box
                  sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography fontWeight="" fontSize="15px" color="#222">{chat.chat_partner_name}</Typography>
                  <Typography sx={{ fontSize: "13px", opacity: 0.9, color: chat.unread_count > 0 ? "#44dd" : "#aaa" }}>
                    {chat.last_timestamp
                      ? moment(chat.last_timestamp).isSame(moment(), "day")
                      ? moment(chat.last_timestamp).format("HH:mm")
                      : moment(chat.last_timestamp).isSame(moment().subtract(1, "day"), "day")
                      ? "Yesterday"
                      : moment(chat.last_timestamp).isAfter(moment().subtract(7, "days"))
                      ? moment(chat.last_timestamp).format("dddd")
                      : moment(chat.last_timestamp).format("DD.MM.YYYY")
                      : ""}
                  </Typography>
                </Box>
              }
              secondary={
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {chat.message_was_deleted_for_everyone || chat.message_was_deleted_for_you
                 ? <Typography component="span" variant="body2" sx={{ opacity: 0.4, color:"00ff", fontStyle:"italic", display:"flex" }}>
                  <ErrorOutline sx={{fontSize:"17px", mr:0.5 }}/> <>Message was deleted</>
                  </Typography>
                  : <Typography component="span" variant="body2" sx={{ opacity: 0.9 }}>
                    {chat.last_message?.length > 20 ? `${chat.last_message.slice(0, 20)}...` : chat.last_message || "No messages"}
                  </Typography>
              }

                  {/* Show tick only if last message was sent by the current user */}
                  {showTick && (
                    <>
                      {chat.is_read === 1 ? (
                        <DoneAll sx={{ fontSize: "15px" }} />
                      ) : (
                        <Done sx={{ fontSize: "13px" }} />
                      )}
                    </>
                  )}

                  {/* Show unread count only if last message was sent by the chat partner and unread_count > 0 */}
                  {showUnreadCount && (
                    <Box
                      sx={{
                        bgcolor: "#44dd",
                        color: "white",
                        borderRadius: "50%",
                        fontSize: "12px",
                        width: 18,
                        height: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pt:0.1,
                        ml: 1,
                      }}
                    >
                      {chat.unread_count}
                    </Box>
                  )}
                </Box>
              }
            />
          </ListItem>
          <Divider />
        </Box>
      );
    })
  )}
</List>

      {/* Suggested Friends Section */}
      <Typography fontWeight="semi-bold" sx={{ mt: 3, mb: 1, fontSize:'large', color:'#222' }}>
  Suggested Friends
</Typography>

{loading ? (
  <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
    <CircularProgress size={24} />
  </Box>
) : suggestedFriends.length === 0 ? (
  <Typography sx={{ p: 2, textAlign: "center", color: "gray" }}>
    No suggestions available
  </Typography>
) : (
  <FriendSuggestions friends={friendSuggestions} setSelectedChat={setSelectedChat} />
)}
    </Box>
  );
};

export default ConversationsList;
