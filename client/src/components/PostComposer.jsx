import { useState } from "react";
import { Box, TextField, Button, IconButton, Snackbar, Alert } from "@mui/material";
import { Image, X } from "react-feather";
import axios from "axios";

const PostComposer = ({ user, onPostCreated }) => {
  const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'http://172.20.10.3:5173';
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  // Handle Image Selection & Preview
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages([...images, ...newImages]);
  };

  // Remove Image from Preview
  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Show notification message
  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
    setTimeout(() => setNotification({ open: false, message: "", severity: "success" }), 3000);
  };

  // Handle Post Submission
  const handleSubmit = async () => {
    if (!user) {
      showNotification("User not found. Please log in again.", "error");
      return;
    }

    if (!content.trim() && images.length === 0) {
      showNotification("Post content or image is required!", "warning");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("content", content);
    images.forEach((img) => formData.append("images", img.file)); // Append image files

    try {
      const response = await axios.post(`${API_BASE_URL}/create-post`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        setContent("");
        setImages([]);
        showNotification("Post created successfully!", "success");
        // Fetch posts again to update the feed with correct data
        onPostCreated();
      } else {
        showNotification("Failed to post. Please try again.", "error");
      }
    } catch (error) {
      console.error("Axios Error:", error.response ? error.response.data : error.message);
      showNotification("Failed to post. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 1, bgcolor: "#fefefd", borderRadius: 2, boxShadow: 0, borderBottom:"1px solid #ddd" }}>
      {/* Success/Error Notification */}
      <Snackbar open={notification.open} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={notification.severity}>{notification.message}</Alert>
      </Snackbar>

      <TextField
        fullWidth multiline minRows={2}
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        sx={{ mb: 0 }}
      />

      {/* Image Previews */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        {images.map((img, index) => (
          <Box key={index} sx={{ position: "relative" }}>
            <img src={img.preview} alt="preview" style={{ width: 100, height: 100, borderRadius: 8 }} />
            <IconButton
              sx={{ position: "absolute", top: 0, right: 0, bgcolor: "rgba(0,0,0,0.5)" }}
              onClick={() => removeImage(index)}
            >
              <X size={16} color="#fff" />
            </IconButton>
          </Box>
        ))}
      </Box>

      {/* Upload & Submit */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Button component="label" variant="outlined" startIcon={<Image />} disabled={loading} sx={{ color:"#4444aa", borderColor:"#4444aa"}}>
          Add Images
          <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ background:"#4444aa"}}>
          {loading ? "Posting..." : "Post"}
        </Button>
      </Box>
    </Box>
  );
};

export default PostComposer;
