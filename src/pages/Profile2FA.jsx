import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, CircularProgress } from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Profile2FA = () => {
  const [enabled, setEnabled] = useState(false);
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    // Fetch user 2FA status (assume token in localStorage)
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
        setEnabled(res.data.user.twoFactorEnabled);
      } catch (e) {
        setFeedback('Failed to fetch 2FA status.');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setFeedback('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/api/2fa/generate`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setQr(res.data.qr);
      setSecret(res.data.secret);
    } catch (e) {
      setFeedback(e.response?.data?.message || 'Failed to generate 2FA secret.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setFeedback('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/2fa/verify`, { token: code }, { headers: { Authorization: `Bearer ${token}` } });
      setEnabled(true);
      setFeedback('2FA enabled successfully!');
    } catch (e) {
      setFeedback(e.response?.data?.message || 'Failed to enable 2FA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, margin: 'auto', mt: 8, p: 3, border: '1px solid #ccc', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" gutterBottom>Two-Factor Authentication (2FA)</Typography>
      {loading && <CircularProgress />}
      {enabled ? (
        <Typography color="success.main">2FA is enabled for your account.</Typography>
      ) : (
        <>
          {qr ? (
            <>
              <Typography>Scan this QR code with your authenticator app:</Typography>
              <img src={qr} alt="2FA QR" style={{ width: 200, height: 200, margin: '1rem auto', display: 'block' }} />
              <Typography>Or enter this secret manually: <b>{secret}</b></Typography>
              <TextField
                label="Enter 6-digit code"
                value={code}
                onChange={e => setCode(e.target.value)}
                fullWidth
                margin="normal"
              />
              <Button variant="contained" color="primary" onClick={handleVerify} disabled={loading || !code} fullWidth>
                Verify & Enable 2FA
              </Button>
            </>
          ) : (
            <Button variant="contained" color="primary" onClick={handleGenerate} disabled={loading} fullWidth>
              Setup 2FA
            </Button>
          )}
        </>
      )}
      {feedback && <Typography color="error" sx={{ mt: 2 }}>{feedback}</Typography>}
    </Box>
  );
};

export default Profile2FA;
