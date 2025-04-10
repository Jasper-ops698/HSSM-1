import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Modal,
  TextField,
  Card,
  Grid,
  InputAdornment,
  MenuItem,
  CircularProgress, 
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { saveAs } from 'file-saver'; // Add this import for downloading the report
import { styled } from '@mui/material/styles'; // Import for custom styling
import jsPDF from 'jspdf'; // Import jsPDF for PDF generation

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Styled components for better appearance
const StyledCard = styled(Card)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  textAlign: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  textTransform: 'none',
}));

const Hssm = () => {
  const [showModal, setShowModal] = useState({
    incident: false,
    asset: false,
    task: false,
    meterReading: false,
    Report: false,
  });

  const initialFormData = {
    incident: {
      department: '',
      title: '',
      priority: '',
      description: '',
      date: '',
      file: null,
    },
    asset: {
      name: '',
      serialNumber: '',
      category: 'Fixed Assets',
      location: '',
      'service records': '',
      file: null,
    },
    task: {
      task: '',
      assignedTo: '',
      id: '',
      dueDate: '',
      priority: '',
      'task description': '',
      file: null,
    },
    meterReading: {
      location: '',
      reading: '',
      date: '',
    },
    Report: {
      file: null,
    },
  };

  const [formData, setFormData] = useState(initialFormData);
  const [dashboardData, setDashboardData] = useState({
    totalAssets: 0,
    maintenanceTasks: 0,
    pendingIncidents: 0,
    meterReadings: [],
  });

  const [isLoading, setIsLoading] = useState(false); // State for loading indicator
  const [reportPreview, setReportPreview] = useState(''); // State for report preview
  const [showReportModal, setShowReportModal] = useState(false); // State for report modal
  const [dateRange, setDateRange] = useState({ start: '', end: '' }); // State for date range

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId'); // Assuming userId is stored in localStorage

    try {
      const [incidentResponse, assetResponse, taskResponse, meterReadingResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/hssm/incidents?userId=${userId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/hssm/assets?userId=${userId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/hssm/tasks?userId=${userId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/hssm/meterReadings?userId=${userId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const incidents = await incidentResponse.json();
      const assets = await assetResponse.json();
      const tasks = await taskResponse.json();
      const meterReadings = await meterReadingResponse.json();

      // Transform the data for the pie chart
      const chartData = meterReadings.map((location, index) => ({
        value: location.readings.length, // display the number of readings per location
        name: location._id, // Use the location ID as the name 
        color: ['#ff0000', '#00ff00', '#0000ff'][index % 3], // Assign colors to each location
      }));

      setDashboardData({
        totalAssets: assets.length || 0,
        maintenanceTasks: tasks.length || 0,
        pendingIncidents: incidents.length || 0,
        meterReadings: chartData,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (modal, field, value) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [modal]: { ...prevFormData[modal], [field]: value },
    }));
  };

  const handleReadingChange = (modal, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [modal]: {
        ...prev[modal],
        [field]: value,
      },
    }));
  };

  const handleFileChange = (modal, file) => {
    setFormData((prev) => ({
      ...prev,
      [modal]: { ...prev[modal], file },
    }));
  };

  const handleSubmit = async (modal) => {
    const endpointMap = {
      incident: `${API_BASE_URL}/api/hssm/incidents`,
      asset: `${API_BASE_URL}/api/hssm/assets`,
      task: `${API_BASE_URL}/api/hssm/tasks`,
      meterReading: `${API_BASE_URL}/api/hssm/meterReadings`,
      Report: `${API_BASE_URL}/api/hssm/reports`,
    };

    const data = new FormData();

    if (modal === 'meterReading') {
      // Handle meterReading data separately
      const { location, reading, date } = formData.meterReading;
      if (!location || !reading || !date) {
        alert('All fields are required for a meter reading');
        return;
      }

      data.append('location', location);
      data.append('reading', reading);
      data.append('date', date);
    } else {
      // Handle other modals as before
      const fields = formData[modal];
      for (const key in fields) {
        if (fields[key] !== null && fields[key] !== undefined) {
          data.append(key, fields[key]);
        }
      }
    }
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(endpointMap[modal], {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      if (response.ok) {
        alert(`${modal.charAt(0).toUpperCase() + modal.slice(1)} added successfully!`);
        setFormData((prev) => ({ ...prev, [modal]: initialFormData[modal] }));
        toggleModal(modal);
        fetchData();
      } else {
        const errorData = await response.json();
        console.error(`Failed to add ${modal}:`, errorData);
        alert(`Failed to add ${modal}.`);
      }
    } catch (error) {
      console.error(`Error adding ${modal}:`, error);
      alert(`An error occurred while adding ${modal}.`);
    }
  };

  const toggleModal = (modal) => {
    setShowModal((prev) => ({ ...prev, [modal]: !prev[modal] }));
  };

  const renderModalContent = (modal) => (
    <>
      <Typography variant="h6" gutterBottom>
        {`Add ${modal.charAt(0).toUpperCase() + modal.slice(1)}`}
      </Typography>
      {modal === 'meterReading' ? (
        <Box>
          <TextField
            label="Location"
            fullWidth
            sx={{ mb: 2 }}
            value={formData.meterReading.location}
            onChange={(e) => handleReadingChange(modal, 'location', e.target.value)}
          />
          <TextField
            label="Reading"
            fullWidth
            sx={{ mt: 1 }}
            value={formData.meterReading.reading}
            onChange={(e) => handleReadingChange(modal, 'reading', e.target.value)}
            type="number"
          />
          <TextField
            label="Date"
            fullWidth
            sx={{ mt: 1 }}
            value={formData.meterReading.date}
            onChange={(e) => handleReadingChange(modal, 'date', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarTodayIcon />
                </InputAdornment>
              ),
            }}
            type="date"
          />
        </Box>
      ) : (
        Object.keys(formData[modal]).map((field) => {
          if (field === 'priority') {
            return (
              <TextField
                select
                key={field}
                label="Priority"
                fullWidth
                sx={{ mb: 2 }}
                value={formData[modal].priority}
                onChange={(e) => handleInputChange(modal, field, e.target.value)}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </TextField>
            );
          }

          if (field === 'date') {
            return (
              <TextField
                key={field}
                label="Date"
                fullWidth
                sx={{ mb: 2 }}
                value={formData[modal][field]}
                onChange={(e) => handleInputChange(modal, field, e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon />
                    </InputAdornment>
                  ),
                }}
                type="date"
              />
            );
          }

          if (field === 'category') {
            return (
              <TextField
                select
                key={field}
                label="Category"
                fullWidth
                sx={{ mb: 2 }}
                value={formData.asset.category}
                onChange={(e) => handleInputChange('asset', 'category', e.target.value)}
              >
                <MenuItem value="Fixed Assets">Fixed Assets</MenuItem>
                <MenuItem value="Consumables">Consumables</MenuItem>
              </TextField>
            );
          }

          if (field === 'file') {
            return (
              <Button key={field} variant="outlined" component="label" fullWidth sx={{ mt: 2 }}>
                Upload File
                <input type="file" hidden onChange={(e) => handleFileChange(modal, e.target.files[0])} />
              </Button>
            );
          }

          return (
            <TextField
              key={field}
              label={field.charAt(0).toUpperCase() + field.replace(/_/g, ' ').slice(1)}
              fullWidth
              sx={{ mb: 2 }}
              value={formData[modal][field]}
              onChange={(e) => handleInputChange(modal, field, e.target.value)}
            />
          );
        })
      )}
      <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={() => handleSubmit(modal)}>
        Submit
      </Button>
    </>
  );

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const response = await fetch(`${API_BASE_URL}/api/gemini/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          startDate: dateRange.start,
          endDate: dateRange.end,
        }),
      });

      const data = await response.json();

      if (response.ok && data.report) {
        setReportPreview(data.report); // Set the AI-generated report for editing
        setShowReportModal(true);
      } else {
        alert(data.message || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("An error occurred while generating the report.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!reportPreview) {
      alert("Please generate the report first.");
      return; // Stop execution if the report preview is empty
    }
    generatePDFReport(reportPreview);
  };

  const generatePDFReport = (content) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Weekly Technical Report', 10, 10);

    // Content
    doc.setFontSize(12);
    doc.text(content, 10, 20, { maxWidth: 190 });

    // Save the PDF
    doc.save('Weekly_Technical_Report.pdf');
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold' }}>
        Your Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <StyledCard>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Your Inventory
            </Typography>
            <Typography variant="h5">{dashboardData.totalAssets}</Typography>
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StyledCard>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Your Pending Incidents
            </Typography>
            <Typography variant="h5">{dashboardData.pendingIncidents}</Typography>
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StyledCard>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Your Maintenance Tasks
            </Typography>
            <Typography variant="h5">{dashboardData.maintenanceTasks}</Typography>
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <StyledCard>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Your Meter Readings
            </Typography>
            {dashboardData.meterReadings && dashboardData.meterReadings.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={dashboardData.meterReadings}
                    outerRadius={80}
                    fill="#8884d8"
                  >
                    {dashboardData.meterReadings.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No meter readings available
              </Typography>
            )}
          </StyledCard>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <StyledButton
          variant="contained"
          color="primary"
          onClick={() => window.location.href = '/total'}
        >
          Available Services
        </StyledButton>
        <StyledButton
          variant="contained"
          color="secondary"
          onClick={handleGenerateReport}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Generate Report'}
        </StyledButton>
        <StyledButton
          variant="contained"
          color="success"
          onClick={handleDownloadReport}
        >
          Download Weekly Report
        </StyledButton>
      </Box>

      {/* Date Range Selector */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            value={dateRange.start}
            onChange={(e) => handleDateRangeChange('start', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="End Date"
            type="date"
            fullWidth
            value={dateRange.end}
            onChange={(e) => handleDateRangeChange('end', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        </Grid>
      </Grid>

      {Object.keys(showModal).map((modal) => (
        <Modal
          key={modal}
          open={showModal[modal]}
          onClose={() => toggleModal(modal)}
        >
          <Box sx={modalStyle}>{renderModalContent(modal)}</Box>
        </Modal>
      ))}

      {/* Report Preview Modal */}
      <Modal open={showReportModal} onClose={() => setShowReportModal(false)}>
        <Box
          sx={{
            ...modalStyle,
            width: { xs: '90%', sm: '80%' }, // Responsive width
            maxHeight: '80%',
            overflowY: 'auto',
            backgroundColor: '#f9f9f9',
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            Edit Report
          </Typography>
          <Box
            sx={{
              padding: 2,
              backgroundColor: '#ffffff',
              borderRadius: 2,
              boxShadow: 1,
              maxHeight: 400,
              overflowY: 'auto',
            }}
          >
            <TextField
              multiline
              fullWidth
              rows={15}
              value={reportPreview}
              onChange={(e) => setReportPreview(e.target.value)} // Allow editing
              variant="outlined"
              sx={{ mb: 2 }}
            />
          </Box>
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowReportModal(false)}
              sx={{ mr: 2 }}
            >
              Close
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleDownloadReport}
            >
              Download Report
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Hssm;
