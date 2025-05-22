import { Box, Typography, Button, Container } from "@mui/material";
import { ArrowRight } from "react-feather";
import { Link as ScrollLink } from "react-scroll";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";
import heroBg from "../assets/hero-bg.gif"; 

const Hero = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <Box
      id="home"
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "left",
        backgroundImage: `url(${heroBg})`, 
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "white",
        p: 3,
      }}
    >
      <Container>
        <Typography variant="h2" fontWeight="bold" data-aos="fade-up">
          Connect. Share. Inspire.
        </Typography>
        <Typography variant="h6" sx={{ mt: 2, mb: 4, color:"#f3f3f3", }} data-aos="fade-up" data-aos-delay="200">
          The ultimate social media experience designed for you.
        </Typography>
        <Box data-aos="fade-up" data-aos-delay="400">
          <ScrollLink to="cta" smooth={true} duration={800} spy={true} offset={-70}>
            <Button variant="contained" color="primary" size="large" sx={{ mr: 2 }}>
              Join Now
            </Button>
          </ScrollLink>
          <ScrollLink to="features" smooth={true} duration={800} spy={true} offset={-70}>
            <Button variant="outlined" color="secondary" size="large" endIcon={<ArrowRight />}>
              Learn More
            </Button>
          </ScrollLink>
        </Box>
      </Container>
    </Box>
  );
};

export default Hero;
