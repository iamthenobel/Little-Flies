import { Box, Typography, Grid, Card, CardContent } from "@mui/material";
import { Users, MessageCircle, Shield, ThumbsUp } from "react-feather";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

const features = [
  { icon: <Users size={40} />, title: "Connect with People", desc: "Join a global community and make new connections." },
  { icon: <MessageCircle size={40} />, title: "Real-time Messaging", desc: "Chat instantly with friends and share moments." },
  { icon: <Shield size={40} />, title: "Secure & Private", desc: "Your data is protected with top-level security." },
  { icon: <ThumbsUp size={40} />, title: "Engaging Content", desc: "Discover trending posts and interact with creators." },
];

const Features = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <Box id="features" sx={{ py: 10, textAlign: "center", bgcolor: "#f5f5f5" }}>
      <Typography variant="h4" fontWeight="bold" data-aos="fade-up">
        Why Choose SocialPro?
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4 }} data-aos="fade-up" data-aos-delay="200">
        Explore the amazing features that make us stand out.
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index} data-aos="fade-up" data-aos-delay={index * 200}>
            <Card sx={{ p: 3, textAlign: "center", boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ color: "#1976d2", mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h6" fontWeight="bold">
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>{feature.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Features;
