import { Box, Typography } from "@mui/material";

const AdSection = () => (
  <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 2, textAlign: "center" }}>
    <Typography variant="body2">Sponsored</Typography>
    <Typography variant="body1" fontWeight="bold">Get 20% off on Premium!</Typography>
  </Box>
);

export default AdSection;
