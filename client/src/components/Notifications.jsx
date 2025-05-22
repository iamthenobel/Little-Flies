import { Box, Typography } from "@mui/material";

const Notifications = ({ notifications }) => {
  if (!notifications.length) return <Typography variant="body2" color="textSecondary">No new notifications.</Typography>;

  return (
    <Box>
      {notifications.map((notif) => (
        <Box key={notif.id} sx={{ mb: 1 }}>
          <Typography variant="body2">{notif.message}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default Notifications;
