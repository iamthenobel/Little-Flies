import { Box, Avatar, Typography } from "@mui/material";

const UserProfileSummary = ({ user }) => {
  if (!user) return null;

  return (
    <Box sx={{ textAlign: "center" }}>
      <Avatar src={user.profile_pic || "/default-avatar.png"} sx={{ width: 80, height: 80, mx: "auto", mb: 1 }} />
      <Typography variant="h6">{user.name}</Typography>
      <Typography variant="body2" color="textSecondary">{user.bio || "No bio available"}</Typography>
    </Box>
  );
};

export default UserProfileSummary;
