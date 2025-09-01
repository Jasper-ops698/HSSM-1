import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const WaitingForRole = () => {
  return (
    <Box 
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f4f6f8'
      }}
    >
      <Paper 
        elevation={3}
        sx={{
          padding: 4,
          textAlign: 'center',
          maxWidth: '500px'
        }}
      >
        <Typography variant="h4" gutterBottom>
          Pending Role Assignment
        </Typography>
        <Typography variant="body1">
          Thank you for signing up. Your account is currently pending role assignment by an administrator. 
          You will be notified once your role has been assigned. Please check back later.
        </Typography>
      </Paper>
    </Box>
  );
};

export default WaitingForRole;
