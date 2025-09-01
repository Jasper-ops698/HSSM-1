import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  Card,
  CardContent,
  Tabs,
  Tab
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Receipt, HourglassEmpty, CheckCircle, Announcement } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AnnouncementManager from '../components/AnnouncementManager';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendance, setAttendance] = useState({});
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch KPI data
        const kpiRes = await axios.get(`${API_BASE_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setKpiData(kpiRes.data.kpi);

        // Fetch teacher-specific data
        const res = await axios.get(`${API_BASE_URL}/api/teacher/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboardData(res.data);
      } catch (err) {
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAttendance = async (classId) => {
    try {
      const token = localStorage.getItem('token');
      const date = new Date().toISOString().split('T')[0]; // Today's date
      
      const promises = Object.entries(attendance).map(([studentId, status]) => 
        axios.post(`${API_BASE_URL}/api/teacher/attendance`, 
          { classId, studentId, date, status },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      
      await Promise.all(promises);
      alert('Attendance marked successfully!');
      // Optionally, refresh data
    } catch (err) {
      console.error('Failed to mark attendance:', err);
      alert('Failed to mark attendance.');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
      <Typography variant="h4" gutterBottom>
        Teacher Dashboard
      </Typography>

      {/* KPI Cards */}
      {kpiData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Receipt sx={{ mr: 1 }} /> Total Enrollments
                </Typography>
                <Typography variant="h4">{kpiData.totalEnrollments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <HourglassEmpty sx={{ mr: 1 }} /> Pending Enrollments
                </Typography>
                <Typography variant="h4">{kpiData.pendingEnrollments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ mr: 1 }} /> Approved Enrollments
                </Typography>
                <Typography variant="h4">{kpiData.approvedEnrollments}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs for different sections */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="My Classes" icon={<CheckCircle />} iconPosition="start" />
          <Tab label="Announcements" icon={<Announcement />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box role="tabpanel" hidden={activeTab !== 0}>
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* My Classes and Attendance */}
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>My Classes</Typography>
              {dashboardData?.classes.map(cls => (
                <Accordion key={cls._id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{cls.name}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="subtitle1">Students</Typography>
                    <List>
                      {cls.students.map(student => (
                        <ListItem key={student._id}>
                          <ListItemText primary={student.name} secondary={student.email} />
                          <FormControl component="fieldset">
                            <RadioGroup row value={attendance[student._id] || 'present'} onChange={(e) => handleAttendanceChange(student._id, e.target.value)}>
                              <FormControlLabel value="present" control={<Radio />} label="Present" />
                              <FormControlLabel value="absent" control={<Radio />} label="Absent" />
                            </RadioGroup>
                          </FormControl>
                        </ListItem>
                      ))}
                    </List>
                    <Button variant="contained" onClick={() => handleMarkAttendance(cls._id)}>Mark Attendance for Today</Button>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Grid>

            {/* Reported Absences */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Reported Absences</Typography>
                <List>
                  {dashboardData?.absences.map(absence => (
                    <ListItem key={absence._id}>
                      <ListItemText 
                        primary={absence.studentId.name} 
                        secondary={`Date: ${new Date(absence.date).toLocaleDateString()} - Reason: ${absence.reason}`} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Announcements Tab */}
      <Box role="tabpanel" hidden={activeTab !== 1}>
        {activeTab === 1 && (
          <AnnouncementManager />
        )}
      </Box>
    </Box>
  );
};

export default TeacherDashboard;
