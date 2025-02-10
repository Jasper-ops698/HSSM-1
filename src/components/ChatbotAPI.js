import React, { useState } from "react";
import axios from "axios";
import { Box, Button, TextField, Typography, Paper } from "@mui/material";

const ChatbotAPI = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const decryptMessage = (encryptedMessage) => {
    // Example decryption logic; replace with actual decryption algorithm
    try {
      return atob(encryptedMessage); // Base64 decoding as a placeholder
    } catch (error) {
      console.error("Decryption error:", error);
      return "[Error decrypting message]";
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);

    try {
      const response = await axios.post(
        "https://d69b-41-90-12-31.ngrok-free.app",
        {
          query: input,
        }
      );

      const decryptedContent = decryptMessage(response.data);
      const botMessage = { role: "bot", content: decryptedContent };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      setInput("");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" bgcolor="#f5f5f5" p={2}>
      <Paper elevation={3} style={{ width: "100%", maxWidth: 400, padding: 16 }}>
        <Box
          style={{
            height: 320,
            overflowY: "scroll",
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: 8,
            marginBottom: 16,
          }}
        >
          {messages.map((msg, index) => (
            <Box
              key={index}
              style={{ textAlign: msg.role === "user" ? "right" : "left", marginBottom: 8 }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                {msg.role === "user" ? "You" : "Bot"}:
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {msg.content}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            variant="outlined"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How may I assist you today?"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={sendMessage}
          >
            Send
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatbotAPI;
