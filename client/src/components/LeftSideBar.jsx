import { useState, useEffect } from "react";
import { 
  Box, Avatar, Typography, Button, List, ListItem, 
  ListItemIcon, ListItemText, Divider 
} from "@mui/material";
import { Home, MessageCircle, Bell, Users, Settings, PlusCircle, LogOut } from "react-feather";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Sidebar = ({ setUser }) => {
  const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'http://172.20.10.3:5173';
  const [user, setLocalUser] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found, user must log in.");
          return;
        }
    
        const response = await axios.get(`${API_BASE_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
    
        setLocalUser(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error.response?.data || error);
      }
    };    

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser?.id) {
            await axios.put(`${API_BASE_URL}/api/users/set-offline`, { userId: storedUser.id });
        }

        // Remove authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Update global and local state
        setUser(null);
        setLocalUser(null);

        // Redirect to login page
        navigate("/login");
    } catch (error) {
        console.error("Logout failed:", error);
    }
};

  return (
    <Box sx={{ width: 250, height: "100vh", bgcolor: "#05001105", p: 2, boxShadow: 2, position:"sticky",top:0 }}>
      {error ? (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      ) : user ? (
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar src={user.profile_pic || "/default-avatar.png"} sx={{ width: 64, height: 64, mr: 2 }} />
          <Box>
            <Typography variant="h6">{user.name || "Unknown User"}</Typography>
            <Typography variant="body2" color="textSecondary">{user.email || "No email available"}</Typography>
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" color="textSecondary">Loading user data...</Typography>
      )}

      <Divider sx={{ my: 2 }} />

      <List>
        <ListItem button onClick={() => navigate("/home")}>
          <ListItemIcon><Home size={20} /></ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>
        <ListItem button onClick={() => navigate("/messages")}>
          <ListItemIcon><MessageCircle size={20} /></ListItemIcon>
          <ListItemText primary="Messages" />
        </ListItem>
        <ListItem button onClick={() => navigate("/notifications")}>
          <ListItemIcon><Bell size={20} /></ListItemIcon>
          <ListItemText primary="Notifications" />
        </ListItem>
        <ListItem button onClick={() => navigate("/friends")}>
          <ListItemIcon><Users size={20} /></ListItemIcon>
          <ListItemText primary="Friends" />
        </ListItem>
        <ListItem button onClick={() => navigate("/settings")}>
          <ListItemIcon><Settings size={20} /></ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>

      <Button 
        fullWidth 
        variant="contained" 
        color="primary" 
        startIcon={<PlusCircle />}
        sx={{ mt: 2 }}
        onClick={() => navigate("/create-post")}
      >
        Create Post
      </Button>

      {user && (
        <Button 
          fullWidth 
          variant="outlined" 
          color="error" 
          startIcon={<LogOut />}
          sx={{ mt: 2 }}
          onClick={handleLogout}
        >
          Log Out
        </Button>
      )}
    </Box>
  );
};

export default Sidebar;
