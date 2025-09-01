import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { People, Class, Receipt, HourglassEmpty } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const HodDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/api/hod/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboardData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusChip = (status) => {
    let color = 'default';
    if (status === 'Approved') color = 'success';
    if (status === 'Pending') color = 'warning';
    if (status === 'Rejected') color = 'error';
    return <Chip label={status} color={color} size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3, flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        HOD Dashboard ({user?.department})
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><People sx={{ mr: 1 }} /> Teachers</Typography>
              <Typography variant="h4">{dashboardData?.kpis?.totalTeachers ?? '0'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><Class sx={{ mr: 1 }} /> Classes</Typography>
              <Typography variant="h4">{dashboardData?.kpis?.totalClasses ?? '0'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><Receipt sx={{ mr: 1 }} /> Total Enrollments</Typography>
              <Typography variant="h4">{dashboardData?.kpis?.totalEnrollments ?? '0'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><HourglassEmpty sx={{ mr: 1 }} /> Pending</Typography>
              <Typography variant="h4">{dashboardData?.kpis?.pendingEnrollments ?? '0'}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Department Teachers */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Department Teachers</Typography>
            <List>
              {dashboardData?.teachers?.length > 0 ? (
                dashboardData.teachers.map((teacher) => (
                  <ListItem key={teacher._id} divider>
                    <ListItemText primary={teacher.name} secondary={teacher.email} />
                  </ListItem>
                ))
              ) : (
                <Typography>No teachers found in this department.</Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Department Classes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Department Classes</Typography>
            <List>
              {dashboardData?.classes?.length > 0 ? (
                dashboardData.classes.map((cls) => (
                  <ListItem key={cls._id} divider>
                    <ListItemText
                      primary={cls.name}
                      secondary={`Taught by: ${cls.teacher?.name || 'N/A'} | Credits: ${cls.creditsRequired}`}
                    />
                  </ListItem>
                ))
              ) : (
                <Typography>No classes found in this department.</Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Recent Enrollments */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Enrollment Requests</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.enrollments?.length > 0 ? (
                    dashboardData.enrollments.map((enrollment) => (
                      <TableRow key={enrollment._id}>
                        <TableCell>{enrollment.student?.name || 'N/A'}</TableCell>
                        <TableCell>{enrollment.class?.name || 'N/A'}</TableCell>
                        <TableCell>{getStatusChip(enrollment.status)}</TableCell>
                        <TableCell>{new Date(enrollment.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No recent enrollments.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HodDashboard;
