import { useState } from "react";
import { Box, Container, Typography, Grid, Link, Divider, Accordion, AccordionSummary, AccordionDetails, IconButton, Stack } from "@mui/material";
import { ChevronDown, Facebook, Twitter, Instagram, Linkedin } from "react-feather";

const footerLinks = [
  { title: "Company", links: ["About Us", "Careers", "Press", "Blog"] },
  { title: "Support", links: ["Help Center", "Terms of Service", "Privacy Policy", "Contact Us"] },
  { title: "Social", links: ["Facebook", "Twitter", "Instagram", "LinkedIn"] },
];

const socialIcons = [
  { icon: <Facebook size={20} />, url: "#" },
  { icon: <Twitter size={20} />, url: "#" },
  { icon: <Instagram size={20} />, url: "#" },
  { icon: <Linkedin size={20} />, url: "#" },
];

const Footer = () => {
  const [expanded, setExpanded] = useState(false);
  const handleChange = (panel) => (_, newExpanded) => setExpanded(newExpanded ? panel : false);

  return (
    <Box component="footer" sx={{ bgcolor: "#111", color: "#fff", py: 5, mt: 10 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="center">
          {/* Desktop View: Grid Layout */}
          {footerLinks.map((section, index) => (
            <Grid item xs={12} sm={4} key={index} sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>{section.title}</Typography>
              {section.links.map((link, i) => (
                <Typography key={i} sx={{ mb: 1 }}>
                  <Link href="#" color="inherit" underline="hover">{link}</Link>
                </Typography>
              ))}
            </Grid>
          ))}

          {/* Mobile View: Accordion Layout */}
          {footerLinks.map((section, index) => (
            <Grid item xs={12} key={index} sx={{ display: { sm: "none" } }}>
              <Accordion expanded={expanded === index} onChange={handleChange(index)} sx={{ bgcolor: "transparent", color: "#fff" }}>
                <AccordionSummary expandIcon={<ChevronDown color="#fff" />}>
                  <Typography variant="h6" fontWeight="bold">{section.title}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {section.links.map((link, i) => (
                    <Typography key={i} sx={{ mb: 1 }}>
                      <Link href="#" color="inherit" underline="hover">{link}</Link>
                    </Typography>
                  ))}
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4, bgcolor: "#333" }} />

        {/* Social Media Links */}
        <Stack direction="row" justifyContent="center" spacing={2}>
          {socialIcons.map((social, index) => (
            <IconButton key={index} component="a" href={social.url} sx={{ color: "#fff", "&:hover": { color: "#1DB954" } }}>
              {social.icon}
            </IconButton>
          ))}
        </Stack>

        <Typography textAlign="center" variant="body2" sx={{ mt: 2 }}>
          © {new Date().getFullYear()} YourCompany. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
