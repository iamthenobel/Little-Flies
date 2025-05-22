import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Typography, TextField, Button, CircularProgress, InputAdornment, IconButton, Alert } from "@mui/material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { Eye, EyeOff } from "react-feather";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

const LoginPage = ({ setUser }) => {
  const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'http://172.20.10.3:5173';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    setError(""); // Reset error state
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, data);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user)); // Store user info in localStorage
      setUser(response.data.user);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error.response?.data);
      setError(error.response?.data?.error || "Login failed! Please try again.");
    }
    setLoading(false);
  };  


  return (
    <Box id="login" sx={{ py: 10, textAlign: "center", bgcolor: "#f5f5f5" }}>
      <Container maxWidth="sm">
        <Typography variant="h4" fontWeight="bold">Welcome Back!</Typography>
        <Typography variant="subtitle1" sx={{ mb: 4 }}>Log in to continue</Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth label="Email Address" variant="outlined" margin="normal"
            {...register("email")} error={!!errors.email} helperText={errors.email?.message}
          />
          <TextField
            fullWidth label="Password" type={showPassword ? "text" : "password"} variant="outlined" margin="normal"
            {...register("password")} error={!!errors.password} helperText={errors.password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff /> : <Eye />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" variant="contained" color="primary" size="large" fullWidth sx={{ mt: 3 }} disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : "Log In"}
          </Button>
        </form>

        <Typography variant="body2" sx={{ mt: 2 }}>
          Don't have an account? <a href="/signup" style={{ color: "#1976D2", textDecoration: "none" }}>Sign Up</a>
        </Typography>
      </Container>
    </Box>
  );
};

export default LoginPage;
