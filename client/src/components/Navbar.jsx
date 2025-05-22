import { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography, Button, IconButton, Drawer, List, ListItem, Box } from "@mui/material";
import { Menu, X } from "react-feather";
import { Link as ScrollLink } from "react-scroll";
import AOS from "aos";
import "aos/dist/aos.css";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  const toggleDrawer = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: "Home", to: "home" },
    { text: "Features", to: "features" },
    { text: "Testimonials", to: "testimonials" },
    { text: "Join Now", to: "cta" },
  ];

  return (
    <AppBar position="fixed" sx={{ bgcolor: "white", boxShadow: 3 }}>
      <Toolbar>
        {/* Brand Logo */}
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, fontWeight: "bold", color: "black", cursor: "pointer" }}
          data-aos="fade-right"
        >
          SocialPro
        </Typography>

        {/* Desktop Navigation */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
          {menuItems.map((item) => (
            <ScrollLink
              key={item.text}
              to={item.to}
              smooth={true}
              duration={800}
              spy={true}
              offset={-70}
              style={{ textDecoration: "none" }}
            >
              <Button color="inherit" sx={{ color: "black" }}>
                {item.text}
              </Button>
            </ScrollLink>
          ))}
          <Button variant="contained" color="primary" href="/login">Login</Button>
          <Button variant="outlined" color="primary" href="/signup">Sign Up</Button>
        </Box>

        {/* Mobile Menu Button */}
        <IconButton sx={{ display: { xs: "block", md: "none" } }} onClick={toggleDrawer}>
          <Menu />
        </IconButton>

        {/* Mobile Drawer */}
        <Drawer anchor="right" open={mobileOpen} onClose={toggleDrawer}>
          <Box sx={{ width: 250, p: 2 }}>
            <IconButton onClick={toggleDrawer} sx={{ display: "flex", justifyContent: "flex-end" }}>
              <X />
            </IconButton>
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.text}>
                  <ScrollLink
                    to={item.to}
                    smooth={true}
                    duration={800}
                    spy={true}
                    offset={-70}
                    style={{ textDecoration: "none", width: "100%" }}
                  >
                    <Button fullWidth onClick={toggleDrawer}>{item.text}</Button>
                  </ScrollLink>
                </ListItem>
              ))}
              <ListItem>
  <Button 
    fullWidth 
    variant="contained" 
    color="primary" 
    component="a" 
    href="/login"
  >
    Login
  </Button>
</ListItem>
<ListItem>
  <Button 
    fullWidth 
    variant="outlined" 
    color="primary" 
    component="a" 
    href="/signup"
  >
    Sign Up
  </Button>
</ListItem>
            </List>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
