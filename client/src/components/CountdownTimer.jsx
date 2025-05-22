import React, { useState, useEffect } from "react";
import { CircularProgress, Box, Typography } from "@mui/material";

const CountdownTimer = ({ duration = 10 }) => {
  const [progress, setProgress] = useState(100);
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) return; // Stop when countdown ends

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
      setProgress((prev) => (timeLeft / duration) * 100);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, duration]);

  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress variant="determinate" value={progress} size={20} thickness={4} />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography sx={{ fontSize:"10px"}}>{timeLeft}</Typography>
      </Box>
    </Box>
  );
};

export default CountdownTimer;
