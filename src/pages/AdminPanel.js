import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Grid, Card, CardContent, Button, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const LOGO_COLOR = '#1976d2'; // Replace with your actual logo color

const roleOptions = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'credit-controller', label: 'Credit Controller' },
  { value: 'HOD', label: 'Head of Department' }
];

const AdminPanel = () => {
  const [serviceProviders, setServiceProviders] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchServiceProviders();
  }, []);

  const fetchServiceProviders = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServiceProviders(res.data.users.filter(u => u.role === 'service-provider'));
    } catch (err) {
      setFeedback({ open: true, message: 'Failed to fetch service providers.', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/admin/assignRole`, {
        userId: selectedUser,
        role: selectedRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedback({ open: true, message: 'Role assigned successfully!', severity: 'success' });
      fetchServiceProviders();
    } catch (err) {
      setFeedback({ open: true, message: 'Failed to assign role.', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: LOGO_COLOR, fontWeight: 'bold' }}>
        Admin Panel: Role Assignment
      </Typography>
      <Card sx={{ mb: 4, borderColor: LOGO_COLOR, borderWidth: 2, borderStyle: 'solid' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: LOGO_COLOR }}>
            Assign Roles to Service Providers
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="user-select-label">Service Provider</InputLabel>
                <Select
                  labelId="user-select-label"
                  value={selectedUser}
                  label="Service Provider"
                  onChange={e => setSelectedUser(e.target.value)}
                  sx={{ bgcolor: '#f5f5f5' }}
                >
                  <MenuItem value=""><em>Select a user...</em></MenuItem>
                  {serviceProviders.map(user => (
                    <MenuItem key={user._id} value={user._id}>{user.name} ({user.email})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  value={selectedRole}
                  label="Role"
                  onChange={e => setSelectedRole(e.target.value)}
                  sx={{ bgcolor: '#f5f5f5' }}
                >
                  <MenuItem value=""><em>Select a role...</em></MenuItem>
                  {roleOptions.map(role => (
                    <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAssignRole}
                disabled={isLoading || !selectedUser || !selectedRole}
                sx={{ mt: 2, bgcolor: LOGO_COLOR }}
              >
                Assign Role
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback({ ...feedback, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setFeedback({ ...feedback, open: false })} severity={feedback.severity} variant="filled">
          {feedback.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminPanel;
