import { Box, Typography } from "@mui/material";

const TrendingPosts = ({ posts }) => {
  if (!posts.length) return <Typography variant="body2" color="textSecondary">No trending posts.</Typography>;

  return (
    <Box>
      {posts.map((post) => (
        <Box key={post.id} sx={{ mb: 2 }}>
          <Typography variant="body1" fontWeight="bold">{post.user_name}</Typography>
          <Typography variant="body2">{post.content.slice(0, 100)}...</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default TrendingPosts;
