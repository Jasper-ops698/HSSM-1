import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People,
  CreditCard,
  Warning,
  Add,
  Remove,
  Refresh,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const CreditControllerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creditDialog, setCreditDialog] = useState({ open: false, student: null, action: '' });
  const [creditAmount, setCreditAmount] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch main dashboard data (KPIs)
      const kpiRes = await axios.get(`${API_BASE_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setKpiData(kpiRes.data.kpi);

      // Fetch credit-specific data
      const res = await axios.get(`${API_BASE_URL}/api/credit/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreditAction = async () => {
    if (!creditDialog.student || !creditAmount) return;

    try {
      const token = localStorage.getItem('token');
      const endpoint = creditDialog.action === 'add' ? '/api/credit/add' : '/api/credit/deduct';

      await axios.post(`${API_BASE_URL}${endpoint}`, {
        userId: creditDialog.student._id,
        amount: parseInt(creditAmount)
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCreditDialog({ open: false, student: null, action: '' });
      setCreditAmount('');
      fetchDashboardData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update credits');
    }
  };

  const getCreditStatus = (credits) => {
    const creditValue = credits || 0;
    if (creditValue === 0) return { label: 'No Credits', color: 'error' };
    if (creditValue < 10) return { label: 'Low Credits', color: 'warning' };
    return { label: 'Good Standing', color: 'success' };
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Credit Controller Dashboard
      </Typography>

      {/* KPI Cards */}
      {kpiData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Students
                </Typography>
                <Typography variant="h4">
                  <People sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {kpiData.totalStudents || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Low Credit Students
                </Typography>
                <Typography variant="h4" color="warning.main">
                  <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {kpiData.lowCreditStudents || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Credits Issued
                </Typography>
                <Typography variant="h4">
                  <CreditCard sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {kpiData.totalCreditsIssued || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Actions Today
                </Typography>
                <Typography variant="h4">
                  <Refresh sx={{ mr: 1, verticalAlign: 'middle' }} />
                  0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Students Table */}
      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Student Credit Management</Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Credits</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboardData?.students?.map((student) => {
                const status = getCreditStatus(student.credits);
                return (
                  <TableRow key={student._id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.credits || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Add Credits">
                        <IconButton
                          color="success"
                          onClick={() => setCreditDialog({ open: true, student, action: 'add' })}
                        >
                          <Add />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Deduct Credits">
                        <IconButton
                          color="error"
                          onClick={() => setCreditDialog({ open: true, student, action: 'deduct' })}
                        >
                          <Remove />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Credit Action Dialog */}
      <Dialog open={creditDialog.open} onClose={() => setCreditDialog({ open: false, student: null, action: '' })}>
        <DialogTitle>
          {creditDialog.action === 'add' ? 'Add Credits' : 'Deduct Credits'}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {creditDialog.student?.name} - Current Credits: {creditDialog.student?.credits || 0}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            variant="outlined"
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreditDialog({ open: false, student: null, action: '' })}>
            Cancel
          </Button>
          <Button onClick={handleCreditAction} variant="contained">
            {creditDialog.action === 'add' ? 'Add' : 'Deduct'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreditControllerDashboard;
