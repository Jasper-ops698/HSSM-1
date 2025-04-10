import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CircularProgress,
  Button,
  Pagination,
  Typography,
  Box,
  Modal,
  Card,
  Grid,
} from '@mui/material';
import { Pie, Bar } from 'react-chartjs-2';
import { styled } from '@mui/material/styles';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
} from 'chart.js';
import jsPDF from 'jspdf'; // Import jsPDF for PDF generation

ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ArcElement);

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

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: '80%',
  overflowY: 'auto',
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [hssmReports, setHssmReports] = useState([]);
  const [userRolesData, setUserRolesData] = useState({});
  const [requestStatusesData, setRequestStatusesData] = useState({});
  const [servicesCountData, setServicesCountData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null); // State for selected report
  const [showReportModal, setShowReportModal] = useState(false); // State for report modal
  const itemsPerPage = 5;

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        if (!token) {
          setError('Unauthorized! Please log in.');
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const { data } = await axios.get(`${API_BASE_URL}/api/admin/analytics`, { headers });
        const reportsResponse = await axios.get(
          `${API_BASE_URL}/api/admin/hssmProviderReports?page=${currentPage}&limit=${itemsPerPage}`,
          { headers }
        );

        setUsers(data.users);
        setRequests(data.requests);
        setServices(data.services);
        setHssmReports(reportsResponse.data.reports);
        setTotalReports(reportsResponse.data.totalReports);

        setUserRolesData({
          labels: Object.keys(data.userRoles),
          datasets: [
            {
              data: Object.values(data.userRoles),
              backgroundColor: ['#ff0000', '#0000ff', '#008000', '#808080'],
            },
          ],
        });

        setRequestStatusesData({
          labels: Object.keys(data.requestStatuses),
          datasets: [
            {
              data: Object.values(data.requestStatuses),
              backgroundColor: ['#ffcc00', '#36a2eb', '#ff8e72'],
            },
          ],
        });

        setServicesCountData({
          labels: Object.keys(data.servicesCount),
          datasets: [
            {
              label: 'Services Count',
              data: Object.values(data.servicesCount),
              backgroundColor: Object.keys(data.servicesCount).map(
                (_, index) => `hsl(${index * 30}, 70%, 50%)`
              ),
            },
          ],
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error fetching data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, API_BASE_URL]);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleDownloadReportPDF = (report) => {
    const doc = new jsPDF();

    // Add content to the PDF
    doc.setFontSize(16);
    doc.text('HSSM Report Details', 10, 10);
    doc.setFontSize(12);
    doc.text(`Provider Name: ${report.providerName}`, 10, 20);
    doc.text(`Description: ${report.description}`, 10, 30);
    doc.text(`Additional Details: ${report.details || 'No additional details provided.'}`, 10, 40);

    // Save the PDF
    doc.save(`${report.providerName}_Report.pdf`);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', color: 'red' }}>
        <Typography>{error}</Typography>
        <StyledButton variant="contained" color="primary" onClick={() => window.location.reload()}>
          Retry
        </StyledButton>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold' }}>
        Admin Dashboard
      </Typography>

      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <StyledButton
          variant="contained"
          color="primary"
          onClick={() => window.location.href = '/total'}
        >
          Available Services
        </StyledButton>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={4}>
          <StyledCard>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Total Users
            </Typography>
            <Typography variant="h5">{users.length}</Typography>
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <StyledCard>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Total Requests
            </Typography>
            <Typography variant="h5">{requests.length}</Typography>
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <StyledCard>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Total Services
            </Typography>
            <Typography variant="h5">{services.length}</Typography>
          </StyledCard>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        HSSM Reports
      </Typography>
      {hssmReports.length === 0 ? (
        <Typography>No reports from HSSM providers found.</Typography>
      ) : (
        <Box>
          <Grid container spacing={2}>
            {hssmReports.map((report) => (
              <Grid item xs={12} md={6} lg={4} key={report.id}>
                <StyledCard>
                  <Typography variant="h6">{report.providerName}</Typography>
                  <Typography variant="body2">{report.description}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <StyledButton
                      variant="contained"
                      color="secondary"
                      onClick={() => handleViewReport(report)}
                    >
                      View Details
                    </StyledButton>
                    <StyledButton
                      variant="contained"
                      color="success"
                      onClick={() => handleDownloadReportPDF(report)}
                    >
                      Download PDF
                    </StyledButton>
                  </Box>
                </StyledCard>
              </Grid>
            ))}
          </Grid>
          <Pagination
            count={Math.ceil(totalReports / itemsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}
          />
        </Box>
      )}

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Analytics
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StyledCard>
            <Typography variant="h6">User Roles</Typography>
            <Pie data={userRolesData} />
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <StyledCard>
            <Typography variant="h6">Request Statuses</Typography>
            <Pie data={requestStatusesData} />
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <StyledCard>
            <Typography variant="h6">Services Count</Typography>
            <Bar data={servicesCountData} options={{ responsive: true }} />
          </StyledCard>
        </Grid>
      </Grid>

      {/* Report Modal */}
      <Modal open={showReportModal} onClose={() => setShowReportModal(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            Report Details
          </Typography>
          {selectedReport && (
            <Box>
              <Typography variant="h6">Provider Name:</Typography>
              <Typography>{selectedReport.providerName}</Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Description:
              </Typography>
              <Typography>{selectedReport.description}</Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Additional Details:
              </Typography>
              <Typography>{selectedReport.details || 'No additional details provided.'}</Typography>
            </Box>
          )}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowReportModal(false)}
              sx={{ mr: 2 }}
            >
              Close
            </Button>
            {selectedReport && (
              <Button
                variant="contained"
                color="success"
                onClick={() => handleDownloadReportPDF(selectedReport)}
              >
                Download PDF
              </Button>
            )}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default AdminDashboard;
