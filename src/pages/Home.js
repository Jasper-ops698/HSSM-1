import React, { useState } from 'react';
import { Button, Box, Typography, TextField, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import Footer from './AboutPage';

const CustomChat = () => {
  const [messages, setMessages] = useState([{ sender: 'bot', text: 'Hello! How can I assist you today?' }]);
  const [input, setInput] = useState('');

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to the chat
    setMessages((prev) => [...prev, { sender: 'user', text: input }]);

    try {
      // Send the message to the backend
      const response = await fetch('http://localhost:5000/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add bot response to the chat
        setMessages((prev) => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'bot', text: 'Sorry, something went wrong.' }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Error connecting to the server.' }]);
    }

    setInput('');
  };

  return (
    <Paper elevation={3} sx={{ padding: 2, maxWidth: 400, margin: 'auto', marginTop: 4 }}>
      <Box sx={{ maxHeight: 300, overflowY: 'auto', marginBottom: 2 }}>
        {messages.map((msg, index) => (
          <Typography
            key={index}
            sx={{
              textAlign: msg.sender === 'user' ? 'right' : 'left',
              backgroundColor: msg.sender === 'user' ? '#e3f2fd' : '#f1f8e9',
              padding: 1,
              borderRadius: 2,
              marginBottom: 1,
            }}
          >
            {msg.text}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={handleSendMessage}>
          Send
        </Button>
      </Box>
    </Paper>
  );
};

const Home = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Main content */}
      <Box sx={{ flex: 1, textAlign: 'center', padding: 4 }}>
        <Typography variant="h3" sx={{ marginBottom: 3 }}>
          Welcome to our Services
        </Typography>
        <Typography variant="h6" sx={{ marginBottom: 3 }}>
          We make work easier.
        </Typography>
        <Button variant="contained" color="primary" component={Link} to="/signup" sx={{ marginRight: 2 }}>
          Get Started
        </Button>
        <Button variant="outlined" color="primary" component={Link} to="/login">
          Login
        </Button>

        {/* Custom Chat Integration */}
        <CustomChat />
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default Home;
