import { Box, Typography, Button, Container } from "@mui/material";
import { ArrowRight } from "react-feather";
import { Link as ScrollLink } from "react-scroll";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";
import ctaBg from "../assets/cta-bg.jpg"; 

const Cta = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <Box
      id="cta"
      sx={{
        height: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        backgroundImage: `url(${ctaBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "white",
        p: 3,
        position: "relative",
        "::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)", 
        },
      }}
    >
      <Container sx={{ position: "relative", zIndex: 2 }}>
        <Typography variant="h3" fontWeight="bold" data-aos="fade-up">
          Join the Future of Social Media
        </Typography>
        <Typography variant="h6" sx={{ mt: 2, mb: 4 }} data-aos="fade-up" data-aos-delay="200">
          Sign up today and start connecting with friends worldwide!
        </Typography>
        <ScrollLink to="signup" smooth={true} duration={800} spy={true} offset={-70}>
          <Button variant="contained" color="primary" size="large" endIcon={<ArrowRight />} data-aos="zoom-in">
            Get Started
          </Button>
        </ScrollLink>
      </Container>
    </Box>
  );
};

export default Cta;
