import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initializeApp } from 'firebase/app';
import { getMessaging, onMessage } from 'firebase/messaging';

// Firebase configuration (ensure it matches your Firebase project)
const firebaseConfig = {
  apiKey: "AIzaSyBhwt9_NRkJ-ujoRq5ywe73JTBblHmVzVk",
  authDomain: "hssm-services.firebaseapp.com",
  projectId: "hssm-services",
  storageBucket: "hssm-services.firebasestorage.app",
  messagingSenderId: "1030828567617",
  appId: "1:1030828567617:web:f5a42fb39222a5a0f8eac0",
  measurementId: "G-5E7RHRP1MX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Register the service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

// Handle foreground messages
onMessage(messaging, (payload) => {
  console.log('Message received in foreground:', payload);
  // Optionally display a notification or update the UI
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
