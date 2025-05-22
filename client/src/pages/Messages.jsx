import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography, Divider, IconButton, useMediaQuery } from "@mui/material";
import {ArrowBackIosNew } from "@mui/icons-material";
import ConversationsList from "../components/ConversationsList";
import ChatWindow from "../components/ChatWindow";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Messages = ({ currentUser }) => {
  const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'http://192.168.43.238:5000';
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const location = useLocation();
  const [user, setUser] = useState(currentUser || null);
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const [showChat, setShowChat] = useState(false);

useEffect(() => {
  if (!user) {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser) setUser(storedUser);
    } catch (error) {
      console.error("Error retrieving user from localStorage:", error);
    }
  }
}, [currentUser]);


useEffect(() => {
  if (!user || !user.id) {
    console.error("Error: `user` or `user.id` is undefined");
    return;
  }

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data);
    } catch (error) {
      console.error("Error fetching conversations:", error.response?.data || error.message);
    }
  };

  fetchConversations();
  const interval = setInterval(fetchConversations, 500);
  return () => clearInterval(interval);
}, [user]);

  
  useEffect(() => {
    if (!user) return;

    const searchParams = new URLSearchParams(location.search);
    const userIdFromParams = searchParams.get("user");

    if (userIdFromParams) {
      const existingChat = conversations.find(chat => chat.user_id === parseInt(userIdFromParams));

      if (existingChat) {
        setSelectedChat(existingChat); 
      } else {
        fetchUserDetails(userIdFromParams);
      }
    }
  }, [location.search, conversations, user]);

  const fetchUserDetails = async (userId) => {
    if (!userId) {
      console.error("Invalid userId:", userId);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 && response.data) {
        const userData = response.data;
        const newChat = {
          id: `${userData.id}`,
          user_id: userData.id,
          name: userData.name,
          profile_pic: userData.profile_pic,
          lastMessage: "",
          messages: [],
        };
        // setSelectedChat(newChat);
      } else {
        console.warn("User not found:", userId);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn("User not found (404):", userId);
      } else {
        console.error("Error fetching user details:", error.response?.data || error.message);
      }
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "#f5f5f5" }}>
      {!isMobile || !showChat ? (
        <Box sx={{ width: isMobile ? "100%" : 280, bgcolor: "#ddffcc10", boxShadow: 2, overflowY: "auto" }}>
          <Box sx={{ display: "flex", alignItems: "center", px: 1 }}>
            <IconButton onClick={() => navigate("/dashboard")}>
              <ArrowBackIosNew />
            </IconButton>
            <Typography variant="h6" sx={{ py: 2 }}>Chats</Typography>
          </Box>
          <Divider />
          <ConversationsList 
            conversations={conversations} 
            setSelectedChat={(chat) => {
              setSelectedChat(chat);
              if (isMobile) setShowChat(true);
            }} 
          />
        </Box>
      ) : null}

      {(!isMobile || showChat) && (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", bgcolor: "#fff", boxShadow: 2 }}>
          {selectedChat ? (
            <>
              <ChatWindow selectedChat={selectedChat} user={user} setShowChat={setShowChat} setSelectedChat={setSelectedChat}/>
            </>
          ) : (
            <Typography variant="h6" sx={{ m: "auto", color: "gray" }}>
              Select a chat to start messaging
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Messages;
