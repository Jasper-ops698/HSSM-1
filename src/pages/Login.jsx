import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Ensure this path is correct
import { IoEye, IoEyeOff } from 'react-icons/io5';
import { getMessaging, getToken } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

// --- Firebase Config --- (Ensure your .env variables are loaded correctly)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// --- API URL --- (Ensure your .env variable is loaded correctly)
const API_BASE_URL = process.env.REACT_APP_API_URL;

const Login = () => {
  // Ensure useAuth() provides a 'login' function
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [pendingLogin, setPendingLogin] = useState(null); // Store login data for 2FA retry
  const navigate = useNavigate();

  // --- Firebase Initialization and Device Token ---
  useEffect(() => {
    let app;
    try {
      // Prevent re-initialization if already done elsewhere
      // Note: This basic check might not be robust enough in complex scenarios
      // Consider using a more formal check like getApps().length === 0
      app = initializeApp(firebaseConfig);
    } catch (err) {
      console.warn("Firebase app already initialized or initialization failed:", err);
      // Optionally get the existing app instance if needed: app = getApp();
    }

    if (app) {
      const messaging = getMessaging(app);

      const requestNotificationPermission = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('Notification permission granted.');
            return true;
          } else {
            console.warn('Notification permission denied.');
            return false;
          }
        } catch (err) {
          console.error('Error requesting notification permission:', err);
          return false;
        }
      };

      const getDeviceToken = async () => {
        const permissionGranted = await requestNotificationPermission();
        if (!permissionGranted) return; // Don't try to get token if permission denied

        try {
          const currentToken = await getToken(messaging, { vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY });
          if (currentToken) {
            console.log('Device Token:', currentToken);
            localStorage.setItem('deviceToken', currentToken);
          } else {
            console.warn('No registration token available. Request permission to generate one.');
          }
        } catch (err) {
          console.error('An error occurred while retrieving token. ', err);
          // Handle specific errors like 'messaging/permission-blocked' if needed
        }
      };

      getDeviceToken();
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Basic validation functions
  const validateEmail = (email) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
  const validatePassword = (password) => password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- Input Validation ---
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!validatePassword(formData.password)) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setError('');
    setLoading(true);
    setTwoFactorRequired(false);
    setTwoFactorToken('');
    setPendingLogin(null);
    try {
      // --- Login API Call ---
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, formData, {
        headers: { 'Content-Type': 'application/json' },
      });

      // --- Response Validation ---
      // Axios throws for non-2xx status codes, so response.status check might be redundant
      // unless you have specific non-2xx codes you want to handle differently here.
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('application/json')) {
        // Log the actual response body for debugging if possible
        console.error('Unexpected response format:', response.data);
        throw new Error('Received non-JSON response from server. Please contact support.');
      }

      const { token, user } = response.data;

      // --- Data Validation ---
      if (!token || !user || !user.id || !user.role) { // Add checks for essential data
          console.error('Incomplete data received from login API:', response.data);
          throw new Error('Authentication failed: Incomplete user data received.');
      }

      console.log('Login successful, received:', { token, user });

      // --- Store Auth Details (Redundancy Check) ---
      // Consider if your AuthContext's login function *also* does this.
      // If AuthContext handles persistence, these lines might be removable.
      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(user));
      console.log('Token and userData stored in localStorage.');

      // --- Update Auth Context State ---
      // This is the crucial step for informing the rest of the app.
      login({ token, user }); // Assuming login updates the context state
      console.log('AuthContext login function called.');

      // --- Device Token Registration (Optional, after successful login) ---
      const deviceToken = localStorage.getItem('deviceToken');
      if (deviceToken && user.id) { // Ensure user.id exists
        const payload = { userId: user.id, deviceToken };
        console.log('Attempting to register device token:', payload);
        try {
            // Make this call non-blocking for the user login flow if possible
            // No need to await if the login doesn't depend on its success
             axios.post(`${API_BASE_URL}/api/auth/device-token`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    // Include Authorization header if this endpoint requires it
                    'Authorization': `Bearer ${token}`
                },
            }).then(deviceTokenResponse => {
                 if (deviceTokenResponse.status === 200) {
                    console.log('Device token registered successfully.');
                 } else {
                    // Log non-200 success responses if applicable
                    console.warn('Device token registration returned status:', deviceTokenResponse.status, deviceTokenResponse.data);
                 }
            }).catch(err => {
                // Log errors separately, don't let this block login success UX
                console.error('Failed to register device token:', err.response?.data || err.message);
            });

        } catch (err) {
          // Catch synchronous errors if any (less likely with axios.post)
          console.error('Error constructing/sending device token request:', err);
        }
      } else if (!deviceToken) {
        console.log('No device token found in localStorage to register.');
      }


      // --- Navigation (Happens AFTER context update is initiated) ---
      console.log(`Navigating based on role: ${user.role}`);
      // Using alert is generally bad UX, consider toast notifications
      // alert('Login successful!');

      switch (user.role) {
        case 'individual':
          navigate('/service');
          break;
        case 'service-provider':
          navigate('/dashboard');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'HSSM-provider':
          navigate('/hssm');
          break;
        default:
          console.error('Unrecognized user role:', user.role);
          setError('Login successful, but encountered an unknown user role.');
          // Maybe navigate to a default dashboard or show an error page
          navigate('/'); // Navigate to a safe default page
          break;
      }

    } catch (err) {
      // 2FA required branch
      if (err.response && err.response.status === 206 && err.response.data.twoFactorRequired) {
        setTwoFactorRequired(true);
        setPendingLogin({ ...formData, userId: err.response.data.userId });
        setError('Two-factor authentication code required.');
        setLoading(false);
        return;
      }
      // Handle Axios errors specifically
      if (err.response) {
        // Server responded with a status code outside the 2xx range
        console.error('Login API Error Response:', err.response.data);
        setError(err.response.data?.message || `Login failed with status: ${err.response.status}`);
      } else if (err.request) {
        // Request was made but no response received (network error, timeout)
        console.error('Login API No Response:', err.request);
        setError('Network error or server did not respond. Please try again.');
      } else {
        // Something happened in setting up the request or processing the response/logic
        console.error('Login Logic Error:', err.message);
        setError(err.message || 'An unexpected error occurred during login.');
      }
      setLoading(false);
    }
  };

  // Handle 2FA code submission
  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: pendingLogin.email,
        password: pendingLogin.password,
        twoFactorToken,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      const { token, user } = response.data;
      login({ token, user });
      setTwoFactorRequired(false);
      setTwoFactorToken('');
      setPendingLogin(null);
      // --- Navigation (Happens AFTER context update is initiated) ---
      console.log(`Navigating based on role: ${user.role}`);
      // Using alert is generally bad UX, consider toast notifications
      // alert('Login successful!');

      switch (user.role) {
        case 'individual':
          navigate('/service');
          break;
        case 'service-provider':
          navigate('/dashboard');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'HSSM-provider':
          navigate('/hssm');
          break;
        default:
          navigate('/');
          break;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid two-factor authentication code.');
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot Password --- (Seems okay, unrelated to main issue)
  const handleForgotPassword = async () => {
    // Basic check if email is entered
    if (!formData.email || !validateEmail(formData.email)) {
        setError('Please enter a valid email address to reset password.');
        return;
    }
    setError(''); // Clear previous errors
    try {
      // Maybe add a loading indicator for this action too
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email: formData.email });
      if (response.status === 200) {
        alert('Password reset email sent. Please check your inbox (and spam folder).'); // Use alert or preferably a toast
      } else {
         // This case might not be reached if axios throws for non-200
        setError(`Failed to send password reset email. Server responded with status: ${response.status}`);
      }
    } catch (err) {
      console.error('Error sending password reset email:', err);
       setError(err.response?.data?.message || 'An error occurred while sending the password reset email.');
    }
  };

  const handleShowPassword = () => setShowPassword(!showPassword);

  // --- Render ---
  return (
    // Consider adding some styling or a container component for better layout
    <Box sx={{ maxWidth: 400, margin: 'auto', mt: 8, p: 3, border: '1px solid #ccc', borderRadius: 2, boxShadow: 3 }}>
       <Typography variant="h5" component="h1" gutterBottom align="center">
        Login
      </Typography>
      {!twoFactorRequired ? (
      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email" // Use type="email" for better semantics and mobile keyboards
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
          required // Add basic HTML5 required validation
        />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          fullWidth
          margin="normal"
          required // Add basic HTML5 required validation
          InputProps={{
            endAdornment: (
              <IconButton onClick={handleShowPassword} edge="end"> {/* Added edge="end" */}
                {showPassword ? <IoEyeOff /> : <IoEye />}
              </IconButton>
            ),
          }}
        />
        {error && (
          <Typography color="error" sx={{ mt: 1, mb: 1, textAlign: 'center' }}>
            {error}
          </Typography>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2, mb: 2 }} // Added mb
          disabled={loading}
        >
          {loading ? 'Logging In...' : 'Log In'}
        </Button>
      </form>
    ) : (
      <form onSubmit={handle2FASubmit}>
        <TextField
          label="2FA Code"
          type="text"
          name="twoFactorToken"
          value={twoFactorToken}
          onChange={e => setTwoFactorToken(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        {error && (
          <Typography color="error" sx={{ mt: 1, mb: 1, textAlign: 'center' }}>
            {error}
          </Typography>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2, mb: 2 }}
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify 2FA'}
        </Button>
      </form>
    )}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
      <Typography variant="body2"> {/* Use Typography for consistent styling */}
        <Link to="/signup">Don't have an account? Sign up</Link>
      </Typography>
      <Button variant="text" size="small" onClick={handleForgotPassword} disabled={loading}> {/* Disable while logging in */}
        Forgot password?
      </Button>
    </Box>
  </Box>
  );
};

export default Login;