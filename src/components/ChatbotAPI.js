import React, {useState} from "react";
import axios from "axios";

const ChatbotAPI = () => {
  const [messages, setMessage] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage =async () => {
  if (!input.trim()) return;
  const userMessage = {role: "user", content:
input};
  setMessage([...messages, userMessage]);

  try {
    const response = await
axios.post("https://d69b-41-90-12-31.ngrok-free.app",{
      query:input,
      });

      const botMessage = {role: "bot", content:
response.data};
      setMessage([...messages, userMessage,
botMessage]);
      setInput("");
    } catch (error) {
      console.error("Error:", error);
      }
    };

return (
<div>
  <div style ={{border: "1px solid #ccc", padding:
"10px",height:"300px",overflowY:"scroll"}}>
    {messages.map((msg, index) => (
    <p key={index} style={{ textAlign: msg.role
==="user"?"right":"left"}}>
      <strong>{msg.role === "user" ? "you" :
"Bot"}:</strong> {msg.content}
      </p>
      ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="How may i assist you today?"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    );
  };

  export default ChatbotAPI;
