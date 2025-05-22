import { Box, AppBar, Toolbar, Typography, IconButton, BottomNavigation, BottomNavigationAction, Drawer, List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem, Divider, Button, Avatar } from "@mui/material";
import { Home, MessageSquare, Bell, Settings, Menu as MenuIcon, ChevronRight, ChevronLeft, User, LogOut, Eye } from "react-feather";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "../components/LeftSideBar";
import RightSidebar from "../components/RightSidebar";
import Feed from "../components/Feed";
import useOnlineStatus from "../services/useOnlineStatus";
import { useMediaQuery } from "@mui/material";
import OnlineUsers from "../components/OnlineUsers";

const Dashboard = ({ setUser, user }) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navValue, setNavValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);

  const isSmallScreen = useMediaQuery("(max-width: 600px)");
  const isTabletScreen = useMediaQuery("(min-width: 601px) and (max-width: 1024px)");

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    
    try {
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
          setUserId(parsedUser.id);
          setUser(parsedUser);
        } else {
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/login");
    }
  }, [setUser, navigate]);
  
  useEffect(() => {
    if (userId !== null) {
      console.log("User ID updated:", userId);
    }
  }, [userId]);  

  useOnlineStatus(userId);

  if (!user) {
    return <div>Checking login parameters. If this persists, please go to the login page to sign in again.</div>;
  }

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column"}}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: "#4444aa", mb: 2, boxShadow: 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: (isTabletScreen && menuOpen) ? "200px" : (isTabletScreen) ? "60px":"0px", transition:"all 0.7s ease" }}>
            Little Flies
          </Typography>

          {/* User Profile Section (Small and Tablet Screens) */}
          {(isSmallScreen || isTabletScreen) && user && (
            <>
              <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                <Avatar
                  alt={user.name}
                  src={user.profilePicture || "/default-avatar.png"}
                  sx={{ width: 40, height: 40, border: "2px solid white" }}
                />
              </IconButton>

              {/* Profile Menu */}
              
<Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={handleMenuClose}
  sx={{ mt: "10px", "& .MuiPaper-root": {
      boxShadow: 1,
      borderRadius: "8px",
      p: 1,
      minWidth: 230,
    }, }}
>
  <MenuItem sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <User size={16} />
    <Typography  sx={{ fontWeight: "semi-bold", color:"#333" }} >
      {user.name}
    </Typography>
  </MenuItem>
  <MenuItem sx={{ display: "flex", alignItems: "center", gap: 1,  "& .MuiPaper-root": {
      p:0,
    },}}>
    <Typography variant="caption" color="textSecondary">
      {user.email}
    </Typography>
  </MenuItem>
  <Divider />
  <MenuItem onClick={handleMenuClose} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <User size={16} />
    View Profile
  </MenuItem>
  <MenuItem onClick={handleMenuClose} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Settings size={16} />
    Settings
  </MenuItem>
  <Divider />
  <MenuItem onClick={handleLogout} sx={{ display: "flex", alignItems: "center", gap: 1, color: "red" }}>
    <LogOut size={16} />
    Logout
  </MenuItem>
</Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flex: 1 }}>
        {/* Left Sidebar (Tablet View with Toggle Arrow) */}
        {isTabletScreen && (
          <Drawer
            variant="permanent"
            sx={{
              width: menuOpen ? 200 : 60,
              transition: "width 0.3s ease",
              "& .MuiDrawer-paper": {
                width: menuOpen ? 200 : 60,
                overflowX: "hidden",
                display: "flex",
                flexDirection: "column",
              },
            }}
          >
            {/* Toggle Arrow */}
            <IconButton
              onClick={handleMenuToggle}
              sx={{
                alignSelf: "center",
                margin: "8px 0",
                transition: "transform 0.3s ease",
              }}
            >
              {menuOpen ? <ChevronLeft /> : <ChevronRight />}
            </IconButton>

            {/* Sidebar Menu */}
            <List>
              {[
                { text: "Home", icon: <Home /> },
                { text: "Messages", icon: <MessageSquare /> },
                { text: "Notifications", icon: <Bell /> },
                { text: "Settings", icon: <Settings /> },
              ].map((item) => (
                <ListItem button key={item.text}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  {menuOpen && <ListItemText primary={item.text} />}
                </ListItem>
              ))}
            </List>
          </Drawer>
        )}

        {/* Full Sidebar for Large Screens */}
        {!isSmallScreen && !isTabletScreen && <Sidebar user={user} setUser={setUser} />}

        {/* Main Feed Section */}
        <Box sx={{ flex: 1, overflowY: "auto", pb: 10, px:2 }}>
          {/*{userId ? <OnlineUsers /> : <p>Checking login parameters. If this persists, please log in again.</p>}*/}
          <Feed user={user} />
        </Box>

        {/* Right Sidebar (Large Screens Only) */}
        {!isSmallScreen && !isTabletScreen && <RightSidebar user={user} setUser={setUser} />}
      </Box>

      {/* Bottom Navigation (Small Screens Only) */}
      {isSmallScreen && (
        <BottomNavigation
          sx={{
            position: "fixed",
            bottom: 0,
            width: "100%",
            bgcolor: "#f2f2f2",
            display:"flex",
            justifyContent:"space-evenly",
            boxShadow:3
          }}
          value={navValue}
          onChange={(e, newValue) => setNavValue(newValue)}
          showLabels
        >
          <BottomNavigationAction label="Home" icon={<Home />} onClick={() => navigate("/dashboard")} />
          <BottomNavigationAction label="Messages" icon={<MessageSquare />} onClick={() => navigate("/messages")} />
          <BottomNavigationAction label="Notifications" icon={<Bell />} />
          <BottomNavigationAction label="Settings" icon={<Settings />} />
          <BottomNavigationAction label="Menu" icon={<MenuIcon />} />
        </BottomNavigation>
      )}
    </Box>
  );
};

export default Dashboard;
