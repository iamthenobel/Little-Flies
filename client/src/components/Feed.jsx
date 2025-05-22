import { useState, useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import axios from "axios";
import PostComposer from "./PostComposer";
import PostCard from "./PostCard";

const Feed = ({ user }) => {
  const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'http://172.20.10.3:5173';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <Box sx={{ maxWidth: 700, mx: 0, mt: 0 }} >
      {/* Pass fetchPosts to PostComposer to refetch after posting */}
      <PostComposer user={user} onPostCreated={fetchPosts} />
      
      {loading ? (
        <CircularProgress sx={{ display: "block", mx: "auto", mt: 3 }} />
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} user={user} />)
      )}
    </Box>
  );
};

export default Feed;
