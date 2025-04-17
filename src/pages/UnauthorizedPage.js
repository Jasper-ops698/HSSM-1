import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        padding: 2,
      }}
    >
      <Typography variant="h4" color="error" gutterBottom>
        Unauthorized Access
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: 3 }}>
        You do not have permission to view this page. Please log in to continue.
      </Typography>
      <Button variant="contained" color="primary" onClick={handleGoToLogin}>
        Go to Login
      </Button>
    </Box>
  );
};

export default UnauthorizedPage;
