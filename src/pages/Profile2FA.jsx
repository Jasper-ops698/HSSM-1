import React from 'react';
import TwoFactorSettings from '../components/TwoFactorSettings';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const Profile2FA = () => {
  const token = localStorage.getItem('token');
  return (
    <TwoFactorSettings apiBaseUrl={API_BASE_URL} token={token} />
  );
};

export default Profile2FA;
