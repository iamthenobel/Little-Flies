import { useState } from "react";
import { Box, Avatar, Typography, IconButton, Snackbar, Alert, Divider } from "@mui/material";
import { Heart, MessageCircle, MoreVertical } from "react-feather";
import { Link } from "react-router-dom";
import axios from "axios";
import moment from "moment";

const PostCard = ({ post, user }) => {
  const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'http://172.20.10.3:5173';
  const [likes, setLikes] = useState(post.likes || 0);
  const [liked, setLiked] = useState(post.liked || false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "warning" });

  const handleLike = async () => {
    if (!user || !user.id) {
      setNotification({ open: true, message: "You need to log in to react to a post.", severity: "warning" });
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/posts/${post.id}/like`, {
        user_id: user.id,
      });

      if (response.data.success) {
        setLikes(response.data.likes);
        setLiked(response.data.liked);
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  return (
    <Box
      sx={{
        p: 1,
        
        borderRadius: 3,
        mt: 2,
        boxShadow: "0px 1px 1px rgba(0, 0, 0, 0.05)",
        transition: "0.3s ease",
        "&:hover": { boxShadow: "0px 2px 2px rgba(0, 0, 0, 0.05)" },
      }}
    >
      {/* User Info */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb:1 }}>
        <Avatar src={post.profile_pic || "/default-avatar.png"} sx={{ width: 50, height: 50 }} />
        <Box>
          <Typography fontWeight="bold" component={Link} to={`/profile/${post.user_id}`} sx={{ textDecoration: "none", color: "black", "&:hover": { color: "#1976D2" } }}>
            {post.user_name || "Unknown User"}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {moment(post.timestamp).fromNow()}
          </Typography>
        </Box>
        <Box>
        <MoreVertical size={20} sx={{marginLeft :"200px" }}/>
        </Box>
      </Box>
      <Divider sx={{ opacity:0.3}}/>

      {/* Post Content */}
      <Typography sx={{ mt: 2, fontSize: "1rem", lineHeight: 1.5 }}>{post.content}</Typography>

      {/* Post Images */}
      {post.image_paths && post.image_paths.length > 0 && (
      <Box sx={{ mt: 2 }}>
      {post.image_paths.length === 1 ? (
        // Single image
        <a href={post.image_paths[0]} target="_blank" rel="noopener noreferrer">
          <img
            src={post.image_paths[0]}
            alt="post"
            style={{
              width: "100%",
              height: "500px", 
              objectFit: "cover",
              borderRadius: 8,
            }}
            onError={(e) => console.error("Image load error:", e.target.src)}
          />
        </a>
      ) : (
        // Multiple images: Two-column grid, equal height
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1,
          }}
        >
          {post.image_paths.map((img, index) => {
            const imageUrl = img.startsWith("blob:") ? "" : `${img}`;
            return imageUrl ? (
              <a key={index} href={imageUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  alt="post"
                  style={{
                    width: "100%",
                    height: "200px", 
                    objectFit: "cover", 
                    borderRadius: 8,
                  }}
                  onError={(e) => console.error("Image load error:", e.target.src)}
                />
              </a>
            ) : null;
          })}
        </Box>
      )}
    </Box>        
      )}

      {/* Like & Comment */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0 }}>
        <Box sx={{ display: "flex", gap: 0 }}>
          <IconButton onClick={handleLike}>
            <Heart color={liked ? "red" : "black"} size={16}/>
            <Typography sx={{ ml: 0.5, fontSize:"14px" }}>{likes}</Typography>
          </IconButton>

          <IconButton>
            <MessageCircle size={16}/>
            <Typography sx={{ ml: 0.5 }}>{post.comments?.length || 0}</Typography>
          </IconButton>
        </Box>
      </Box>

      {/* Snackbar Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={notification.severity}>{notification.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PostCard;
