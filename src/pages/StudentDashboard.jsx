import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
} from '@mui/material';
import { CalendarToday, Notifications, AccountBalanceWallet, Receipt, HourglassEmpty, CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StudentAbsenceModal from './StudentAbsenceModal'; // Assuming this component exists

const API_BASE_URL = process.env.REACT_APP_API_URL;

const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAbsenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        // Fetch main dashboard data (KPIs)
        const kpiRes = await axios.get(`${API_BASE_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setKpiData(kpiRes.data.kpi);

        // Fetch student-specific data
        const res = await axios.get(`${API_BASE_URL}/api/student/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboardData(res.data);

        // Fetch announcements for student
        const announcementsRes = await axios.get(`${API_BASE_URL}/api/announcements`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAnnouncements(announcementsRes.data);
      } catch (err) {
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleOpenAbsenceModal = () => {
    setAbsenceModalOpen(true);
  };

  const handleCloseAbsenceModal = () => {
    setAbsenceModalOpen(false);
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
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Welcome Banner with Personalized Message */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4, 
          background: 'linear-gradient(120deg, #0052cc 0%, #3f8eff 100%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Welcome back, {user?.name}!
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
            <Typography variant="body1">
              You have {kpiData?.pendingEnrollments || 0} pending enrollment requests and {dashboardData?.notifications?.length || 0} new notifications.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {kpiData?.creditBalance || 0}
              </Typography>
              <Typography variant="body2">
                Available Credits
              </Typography>
              <Button 
                variant="contained" 
                color="secondary"
                sx={{ mt: 2, bgcolor: 'white', color: '#0052cc', '&:hover': { bgcolor: '#e0e0e0' } }} 
                href="/classes"
              >
                Browse Classes
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Announcements Banner */}
      {announcements && announcements.length > 0 && (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2, 
            mb: 4, 
            bgcolor: '#fff8e1',
            borderLeft: '4px solid #ffc107',
            borderRadius: 1
          }}
        >
          <Typography variant="h6" sx={{ color: '#f57c00', mb: 1, display: 'flex', alignItems: 'center' }}>
            <Notifications sx={{ mr: 1 }} /> Important Announcements
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List disablePadding>
            {announcements.slice(0, 3).map((announcement, index) => (
              <React.Fragment key={announcement._id || index}>
                <ListItem sx={{ py: 1, display: 'block' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {announcement.title}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={new Date(announcement.createdAt).toLocaleDateString()} 
                      sx={{ fontSize: '0.7rem' }} 
                    />
                  </Box>
                  <Typography variant="body2" sx={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical',
                    mb: 1
                  }}>
                    {announcement.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    From: {announcement.createdBy?.name || 'Teacher'}
                  </Typography>
                </ListItem>
                {index < announcements.slice(0, 3).length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
          {announcements.length > 3 && (
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Button size="small" variant="outlined">
                View All Announcements ({announcements.length})
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* KPI Cards */}
      {kpiData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountBalanceWallet sx={{ mr: 1 }} /> Credits
                </Typography>
                <Typography variant="h4">{kpiData.creditBalance}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Receipt sx={{ mr: 1 }} /> Total Enrollments
                </Typography>
                <Typography variant="h4">{kpiData.totalEnrollments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <HourglassEmpty sx={{ mr: 1 }} /> Pending
                </Typography>
                <Typography variant="h4">{kpiData.pendingEnrollments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ mr: 1 }} /> Approved
                </Typography>
                <Typography variant="h4">{kpiData.approvedEnrollments}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Timetable */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarToday sx={{ mr: 1 }} /> Today's Timetable
            </Typography>
            <List>
              {dashboardData?.timetables.length > 0 ? (
                dashboardData.timetables.map((item) => (
                  <ListItem key={item._id}>
                    <ListItemText
                      primary={`${item.dayOfWeek} - ${item.startTime} to ${item.endTime}`}
                      secondary={`Subject: ${item.subject} | Room: ${item.roomNumber}`}
                    />
                  </ListItem>
                ))
              ) : (
                <Typography>No classes scheduled today.</Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Notifications sx={{ mr: 1 }} /> Recent Notifications
            </Typography>
            <List>
              {dashboardData?.notifications.length > 0 ? (
                dashboardData.notifications.map((notification) => (
                  <ListItem key={notification._id}>
                    <ListItemText primary={notification.message} />
                  </ListItem>
                ))
              ) : (
                <Typography>No new notifications.</Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Absence Reporting */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Absence Reporting
            </Typography>
            <Typography sx={{ mb: 2 }}>
              If you are unable to attend a class, please report your absence here.
            </Typography>
            <Button variant="contained" onClick={handleOpenAbsenceModal}>
              Report Absence
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <StudentAbsenceModal
        open={isAbsenceModalOpen}
        onClose={handleCloseAbsenceModal}
        studentId={user?.id}
        classes={dashboardData?.classes || []}
      />
    </Box>
  );
};

export default StudentDashboard;
