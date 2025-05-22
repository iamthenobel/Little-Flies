import { useEffect, useState } from "react";
import { Box, Typography, Divider } from "@mui/material";
import axios from "axios";
import UserProfileSummary from "./UserProfileSummary";
import TrendingPosts from "./TrendingPosts";
import FriendSuggestions from "./FriendSuggestions";
import Notifications from "./Notifications";
import AdSection from "./AdSection";

const RightSidebar = ({ user }) => {
  const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'http://172.20.10.3:5173';
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [friendSuggestions, setFriendSuggestions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Fetch trending posts
    axios.get(`${API_BASE_URL}/trending-posts`)
      .then((res) => setTrendingPosts(res.data))
      .catch((err) => console.error("Error fetching trending posts:", err));

    // Fetch friend suggestions
    axios.get(`${API_BASE_URL}/friend-suggestions?user_id=${user.id}`)
      .then((res) => setFriendSuggestions(res.data))
      .catch((err) => console.error("Error fetching friend suggestions:", err));

    // Fetch notifications
    axios.get(`${API_BASE_URL}/notifications?user_id=${user.id}`)
      .then((res) => setNotifications(res.data))
      .catch((err) => console.error("Error fetching notifications:", err));
  }, [user]);

  return (
    <Box
      sx={{
        width: 300,
        bgcolor: "#05001105",
        p: 2,
        boxShadow: 2,
        borderRadius: 2,
        height: "100vh",
        overflowY: "auto",
        position:"sticky",top:0
      }}
    >
      {/* User Profile Summary */}
      <UserProfileSummary user={user} />

      <Divider sx={{ my: 2 }} />

      {/* Trending Posts */}
      <Typography variant="h6" sx={{ fontWeight: "light", mb: 1, fontSize :"18px" }}>Trending Posts</Typography>
      <TrendingPosts posts={trendingPosts} />

      <Divider sx={{ my: 2 }} />

      {/* Friend Suggestions */}
      <Typography variant="h6" sx={{ fontWeight: "light", mb: 1, fontSize :"18px" }}>People You May Know</Typography>
      <FriendSuggestions friends={friendSuggestions} />

      <Divider sx={{ my: 2 }} />

      {/* Notifications */}
      <Typography variant="h6" sx={{ fontWeight: "semi-bold", mb: 1, fontSize: "18" }}>Recent Notifications</Typography>
      <Notifications notifications={notifications} />

      <Divider sx={{ my: 2 }} />

      {/* Ad Section */}
      <AdSection />
    </Box>
  );
};

export default RightSidebar;
