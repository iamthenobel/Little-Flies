import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, TextField, Button, Container, CircularProgress, InputAdornment, IconButton, Alert } from "@mui/material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import { Eye, EyeOff } from "react-feather";

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'http://172.20.10.3:5173';
const schema = yup.object().shape({
  name: yup.string().required("Full name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

const Signup = ({ setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError("");
    try {
      const response = await axios.post(`${API_BASE_URL}/signup`, data);
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      navigate("/dashboard");
    } catch (error) {
      console.error("Signup error:", error.response?.data);
      setServerError(error.response?.data?.error || "Signup failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Box id="signup" sx={{ py: 10, textAlign: "center", bgcolor: "#f5f5f5" }}>
      <Container maxWidth="sm">
        <Typography variant="h4" fontWeight="bold">Create Your Account</Typography>
        <Typography variant="subtitle1" sx={{ mb: 4 }}>Join our community today!</Typography>

        {/* Display Server Error */}
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth label="Full Name" variant="outlined" margin="normal"
            {...register("name")} error={!!errors.name} helperText={errors.name?.message}
          />
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
            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
          </Button>
        </form>
      </Container>
    </Box>
  );
};

export default Signup;
