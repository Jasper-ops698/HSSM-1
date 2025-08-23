import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, TextField, Paper, IconButton, Menu, MenuItem, Chip, Stack, Collapse } from '@mui/material';
import { Link } from 'react-router-dom';
import Footer from './AboutPage';
import MarkdownRenderer from '../components/MarkdownRenderer';
import ChatIcon from '@mui/icons-material/Chat';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import Modal from '@mui/material/Modal';
import CircularProgress from '@mui/material/CircularProgress';

// Use environment variable for API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Common topics for suggestions
const COMMON_TOPICS = [
  "Tell me about your services",
  "How can I book a service?",
];

const CustomChat = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(COMMON_TOPICS);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [historyAnchorEl, setHistoryAnchorEl] = useState(null);
  const chatBoxRef = React.useRef(null);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Generate suggestions based on chat history
  const generateSuggestions = () => {
    const userMessages = messages
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.text);
    
    // If user has no history, return common topics
    if (userMessages.length === 0) return COMMON_TOPICS;

    // Find frequently used keywords
    const keywords = userMessages.join(' ').toLowerCase()
      .split(' ')
      .filter(word => word.length > 3);
    
    // Count keyword frequency
    const keywordCount = {};
    keywords.forEach(word => {
      keywordCount[word] = (keywordCount[word] || 0) + 1;
    });

    // Generate relevant suggestions
    const relevantSuggestions = [
      ...new Set([
        ...COMMON_TOPICS,
        `Tell me more about ${Object.keys(keywordCount).sort((a, b) => keywordCount[b] - keywordCount[a])[0] || 'services'}`,
        "Can you explain the previous answer in more detail?",
        "What other services are related to this?"
      ])
    ].slice(0, 5);

    return relevantSuggestions;
  };

  const handleSendMessage = async (message) => {
    setLoading(true);
    try {
      console.log('Sending message to chat API:', message);
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ message }),
      });
      
      console.log('Raw response:', response);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.reply || `Server error: ${response.status} ${response.statusText}`);
      }
      
      if (!data.success) {
        throw new Error(data.reply || 'The AI service is currently unavailable');
      }
      
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: data.reply }
      ]);

      // Update suggestions after bot response
      setSuggestions(generateSuggestions());
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { 
          sender: 'bot', 
          text: error.message || 'Sorry, I encountered an error. Please try again.' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const messageText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: messageText }]);
    await handleSendMessage(messageText);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    handleSendMessage(suggestion);
  };

  const handleHistoryClick = (event) => {
    setHistoryAnchorEl(event.currentTarget);
  };

  const handleHistoryClose = () => {
    setHistoryAnchorEl(null);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your chat history?')) {
      setMessages([{ sender: 'bot', text: 'Hello! How can I assist you today?' }]);
      localStorage.removeItem('chatHistory');
      handleHistoryClose();
    }
  };

  const historyOpen = Boolean(historyAnchorEl);

  return (
    <Paper elevation={3} sx={{ p: 2, maxWidth: 420, m: 'auto', mt: 4, display: 'flex', flexDirection: 'column', height: 500 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <IconButton onClick={handleHistoryClick} color="primary" title="Chat History">
          <HistoryIcon />
        </IconButton>
        <Menu
          anchorEl={historyAnchorEl}
          open={historyOpen}
          onClose={handleHistoryClose}
          PaperProps={{
            style: {
              maxHeight: 300,
              width: '250px',
            },
          }}
        >
          <MenuItem onClick={handleClearHistory} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} /> Clear History
          </MenuItem>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', my: 1 }} />
          {messages.slice(1).map((msg, idx) => (
            <MenuItem key={idx} sx={{ 
              whiteSpace: 'normal',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}>
              <Typography variant="caption" color="textSecondary">
                {msg.sender === 'user' ? 'You' : 'Bot'}:
              </Typography>
              <Typography variant="body2">
                {msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      </Box>


      <Box
        ref={chatBoxRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          mb: 2,
          p: 1,
          background: '#f9f9f9',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            sx={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              mb: 1.5,
              p: 1.5,
              borderRadius: 3,
              backgroundColor: msg.sender === 'user' ? '#1976d2' : '#e0e0e0',
              color: msg.sender === 'user' ? '#fff' : '#222',
              wordBreak: 'break-word',
              fontSize: 16,
              boxShadow: 1,
            }}
          >
            {msg.sender === 'bot' ? (
              <MarkdownRenderer content={msg.text} />
            ) : (
              msg.text
            )}
          </Box>
        ))}
      </Box>

      <Box sx={{ mb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setSuggestionsOpen((open) => !open)}
          sx={{ mb: 1 }}
        >
          {suggestionsOpen ? 'Hide Suggestions' : 'Show Suggestions'}
        </Button>
        <Collapse in={suggestionsOpen}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {suggestions.map((suggestion, index) => (
              <Chip
                key={index}
                label={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'primary.light', color: 'white' }
                }}
              />
            ))}
          </Stack>
        </Collapse>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          minRows={1}
          maxRows={4}
          variant="outlined"
          placeholder={loading ? "Please wait..." : "Type your message..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={loading}
          sx={{ opacity: loading ? 0.7 : 1 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          sx={{ minWidth: 80 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Send'}
        </Button>
      </Box>
    </Paper>
  );
};

const Home = () => {
  const [chatOpen, setChatOpen] = useState(false);

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
        {/* Chat Icon Button (fixed at bottom right) */}
        <Box sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1300 }}>
          <Button
            variant="contained"
            color="primary"
            sx={{ borderRadius: '50%', minWidth: 0, width: 56, height: 56, boxShadow: 4 }}
            onClick={() => setChatOpen(true)}
            aria-label="Open chat"
          >
            <ChatIcon fontSize="large" />
          </Button>
        </Box>
        {/* Chat Modal */}
        <Modal open={chatOpen} onClose={() => setChatOpen(false)}>
          <Box sx={{
            position: 'fixed',
            bottom: 96,
            right: 32,
            width: 420,
            maxWidth: '95vw',
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            p: 0,
            outline: 'none',
            zIndex: 1400,
          }}>
            <CustomChat />
          </Box>
        </Modal>
      </Box>
      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default Home;
