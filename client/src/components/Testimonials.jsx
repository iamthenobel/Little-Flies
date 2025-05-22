import { Box, Typography, Card, CardContent, Avatar } from "@mui/material";
import Slider from "react-slick";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Import images
import user1 from "../assets/user1.jpg";
import user2 from "../assets/user2.jpg";
import user3 from "../assets/user3.jpg";
import user4 from "../assets/user4.jpg";

const testimonials = [
  { img: user1, name: "Alice Johnson", text: "This platform changed how I connect with people!" },
  { img: user2, name: "Mark Smith", text: "Absolutely love the interface and experience!" },
  { img: user3, name: "Emily Davis", text: "A fantastic way to share and interact with friends!" },
  { img: user4, name: "David Wilson", text: "Great platform with amazing features." },
];

const Testimonials = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    responsive: [{ breakpoint: 960, settings: { slidesToShow: 1 } }],
  };

  return (
    <Box id="testimonials" sx={{ py: 10, textAlign: "center", bgcolor: "#fff" }}>
      <Typography variant="h4" fontWeight="bold" data-aos="fade-up">
        What Our Users Say
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4 }} data-aos="fade-up" data-aos-delay="200">
        Hear from real users of our platform.
      </Typography>

      <Slider {...settings}>
        {testimonials.map((user, index) => (
          <Card key={index} sx={{ p: 3, m: 2, textAlign: "center", boxShadow: 3 }} data-aos="zoom-in">
            <CardContent>
              <Avatar src={user.img} sx={{ width: 80, height: 80, margin: "0 auto", mb: 2 }} />
              <Typography variant="h6" fontWeight="bold">{user.name}</Typography>
              <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>{user.text}</Typography>
            </CardContent>
          </Card>
        ))}
      </Slider>
    </Box>
  );
};

export default Testimonials;
