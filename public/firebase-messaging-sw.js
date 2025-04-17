// Import the Firebase SDKs using importScripts (standard for service workers)
// Use specific versions for stability (e.g., 9.22.1) - check your package.json for the version you installed
try {
    importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');
  
    // --- START: REPLACE WITH YOUR ACTUAL CONFIG VALUES ---
    const firebaseConfig = {
        apiKey: "AIzaSyBhwt9_NRkJ-ujoRq5ywe73JTBblHmVzVk",
        authDomain: "hssm-services.firebaseapp.com",
        projectId: "hssm-services",
        storageBucket: "hssm-services.firebasestorage.app",
        messagingSenderId: "1030828567617",
        appId: "1:1030828567617:web:f5a42fb39222a5a0f8eac0",
        measurementId: "G-5E7RHRP1MX",
    };
    // --- END: REPLACE WITH YOUR ACTUAL CONFIG VALUES ---
  
    // Initialize Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log('[firebase-messaging-sw.js] Firebase initialized.');
    } else {
      firebase.app(); // if already initialized, use that one
      console.log('[firebase-messaging-sw.js] Firebase already initialized.');
    }
  
    // Retrieve an instance of Firebase Messaging so that it can handle background messages.
    // Check if messaging is supported
    if (firebase.messaging.isSupported()) {
      const messaging = firebase.messaging();
      console.log('[firebase-messaging-sw.js] Firebase Messaging obtained.');
  
      // Optional: Set up a handler for messages received while the app is in the background.
      messaging.onBackgroundMessage((payload) => {
        console.log(
          '[firebase-messaging-sw.js] Received background message:',
          payload
        );
  
        // Customize notification here
        const notificationTitle = payload.notification?.title || 'New Notification';
        const notificationOptions = {
          body: payload.notification?.body || 'You have a new message.',
          icon: payload.notification?.icon || '/logo192.png' // Optional: path to an icon in your public folder
          // You can add more options like 'data', 'tag', etc.
          // data: payload.data // Include data payload if you need it when user clicks notification
        };
  
        // Use the Service Worker's registration to show the notification
        // `self` refers to the Service Worker global scope
        return self.registration.showNotification(notificationTitle, notificationOptions);
      });
  
      console.log('[firebase-messaging-sw.js] Background message handler set up.');
  
    } else {
        console.warn('[firebase-messaging-sw.js] Firebase Messaging is not supported in this browser environment.');
    }
  
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error during initialization:', error);
  }