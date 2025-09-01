import React, { useState, useEffect, useCallback } from 'react';
import { IconButton, Badge, Menu, MenuItem, Typography, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/notifications/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
    handleCloseMenu();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <IconButton color="inherit" onClick={handleOpenMenu}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem disabled>
          <Typography variant="h6" component="div">Notifications</Typography>
        </MenuItem>
        <Divider />
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <MenuItem key={notification._id} onClick={handleCloseMenu} sx={{ whiteSpace: 'normal' }}>
              <Typography variant="body2" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                {notification.message}
              </Typography>
            </MenuItem>
          ))
        ) : (
          <MenuItem onClick={handleCloseMenu}>
            <Typography>No new notifications</Typography>
          </MenuItem>
        )}
        {unreadCount > 0 && (
          <>
            <Divider />
            <MenuItem onClick={handleMarkAsRead}>
              <Typography color="primary">Mark all as read</Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;
