import React, { useState } from "react";
import axios from "axios";
import { Box, Button, TextField, Paper } from "@mui/material";

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
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" bgcolor="#f5f5f5">
      <Paper elevation={3} style={{ width: "100%", maxWidth: 400, height: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box
          style={{
            flexGrow: 1,
            overflowY: "scroll",
            padding: 16,
            display: "flex",
            flexDirection: "column-reverse",
            backgroundColor: "#e5ddd5",
          }}
        >
          {[...messages].reverse().map((msg, index) => (
            <Box
              key={index}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 8,
              }}
            >
              <Box
                style={{
                  maxWidth: "70%",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  backgroundColor: msg.role === "user" ? "#dcf8c6" : "white",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                {msg.content}
              </Box>
            </Box>
          ))}
        </Box>

        <Box display="flex" padding={1} bgcolor="#f0f0f0" alignItems="center" borderTop="1px solid #ccc">
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{ backgroundColor: "white", borderRadius: 20 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={sendMessage}
            style={{ marginLeft: 8, borderRadius: 20 }}
          >
            Send
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatbotAPI;
