import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Button,
    Typography,
    Modal,
    TextField,
    Grid,
    InputAdornment,
    MenuItem,
    CircularProgress,
    Container, // Added for consistent padding and max-width
    Paper, // Used for dashboard cards for better elevation control
    IconButton, // For close button in modal
    Alert, // For displaying errors or success messages (optional but good UX)
    useTheme, // To access theme colors
    useMediaQuery, // To adjust layout based on screen size
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close'; // Icon for modal close button
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // Icon for Add buttons
import AssessmentIcon from '@mui/icons-material/Assessment'; // Icon for Report button
import DownloadIcon from '@mui/icons-material/Download'; // Icon for Download button
import EditIcon from '@mui/icons-material/Edit'; // Icon for Edit Report modal
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'; // Added Tooltip
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Optional: for better table formatting in PDF if needed
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001'; // Provide a fallback for local dev

// --- Improved Modal Style ---
// Using a function to access theme dynamically if needed later
const getModalStyle = (theme) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '95%', sm: '80%', md: '60%', lg: '50%' }, // More granular responsive width
    bgcolor: 'background.paper',
    boxShadow: theme.shadows[5], // More subtle shadow
    borderRadius: theme.shape.borderRadius * 2, // Nicer rounded corners
    p: 0, // Padding will be handled by modal content sections
    maxHeight: '90vh', // Use viewport height
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden', // Prevent body scroll, handle scroll inside
});

// --- Styled Components (Optional - Can use sx prop too) ---
// Keeping StyledCard for consistency, but enhancing it slightly
const StyledDashboardCard = (props) => (
    <Paper
        elevation={3} // Control shadow depth
        sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%', // Make cards equal height in a row
            textAlign: 'center',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6, // Increase shadow on hover
            },
        }}
        {...props}
    />
);


const Hssm = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate(); // Initialize navigate for redirection

    const [showModal, setShowModal] = useState({
        incident: false,
        asset: false,
        task: false,
        meterReading: false,
        reportUpload: false, // Renamed for clarity
    });

    const initialFormData = {
        incident: { department: '', title: '', priority: 'Medium', description: '', date: '', file: null },
        asset: { name: '', serialNumber: '', category: 'Fixed Assets', location: '', 'service records': '', file: null },
        task: { task: '', assignedTo: '', id: '', dueDate: '', priority: 'Medium', 'task description': '', file: null },
        meterReading: { location: '', reading: '', date: '' },
        reportUpload: { file: null }, // Renamed
    };

    const [formData, setFormData] = useState(initialFormData);
    const [dashboardData, setDashboardData] = useState({
        totalAssets: 0,
        maintenanceTasks: 0,
        pendingIncidents: 0,
        meterReadings: [],
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true); // Separate state for initial data fetch
    const [reportPreview, setReportPreview] = useState('');
    const [showReportPreviewModal, setShowReportPreviewModal] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [error, setError] = useState(null); // For displaying API errors

    // Define colors for the Pie chart using the theme
    const PIE_COLORS = useMemo(() => ({
        Sunday: '#FFFFFF', // White
        Monday: '#FF0000', // Red
        Tuesday: '#0000FF', // Blue
        Wednesday: '#008000', // Green
        Thursday: '#A52A2A', // Brown
        Friday: '#000000', // Black
        Saturday: '#FFFF00', // Yellow
    }), []); // Wrapped PIE_COLORS in useMemo to prevent reinitialization on every render

    const fetchData = useCallback(async () => {
        setIsFetching(true);
        setError(null);
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');

        if (!token || !userData) {
            setError('Authentication details not found. Please log in.');
            setIsFetching(false);
            return;
        }

        const parsedUserData = JSON.parse(userData);
        const userId = parsedUserData.id;

        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [incidentResponse, assetResponse, taskResponse, meterReadingResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/hssm/incidents?userId=${userId}`, { headers }),
                fetch(`${API_BASE_URL}/api/hssm/assets?userId=${userId}`, { headers }),
                fetch(`${API_BASE_URL}/api/hssm/tasks?userId=${userId}`, { headers }),
                fetch(`${API_BASE_URL}/api/hssm/meterReadings?userId=${userId}`, { headers }),
            ]);

            if (!incidentResponse.ok || !assetResponse.ok || !taskResponse.ok || !meterReadingResponse.ok) {
                throw new Error('Failed to fetch dashboard data.');
            }

            const incidents = await incidentResponse.json();
            const assets = await assetResponse.json();
            const tasks = await taskResponse.json();
            const meterReadings = await meterReadingResponse.json();

            const chartData = meterReadings.map((reading) => {
                const day = new Date(reading.date).toLocaleDateString('en-US', { weekday: 'long' });
                return {
                    name: day,
                    value: reading.value,
                    fill: PIE_COLORS[day],
                };
            });

            setDashboardData({
                totalAssets: assets?.length || 0,
                maintenanceTasks: tasks?.length || 0,
                pendingIncidents: incidents?.length || 0,
                meterReadings: chartData,
            });
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message || 'An error occurred while fetching dashboard data.');
        } finally {
            setIsFetching(false);
        }
    }, [PIE_COLORS]);

    const renderDayColorKey = () => (
        <Box sx={{ mt: 2, textAlign: 'center', width: '100%' }}>
            <Grid container spacing={1} justifyContent="center" sx={{ maxWidth: '100%' }}>
                {Object.entries(PIE_COLORS).map(([day, color]) => (
                    <Grid item key={day} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 20, height: 20, backgroundColor: color, border: '1px solid #000' }} />
                        <Typography variant="caption">{day.slice(0, 3)}</Typography>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Added 'fetchData' to the dependency array to resolve the warning

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');

        if (!token || !userData) {
            alert('Authentication details not found. Redirecting to login.');
            navigate('/login'); // Redirect to login page
            return;
        }

        try {
            const parsedUserData = JSON.parse(userData);
            const userId = parsedUserData.id; // Extract userId from userData

            if (!userId) {
                throw new Error('User ID is missing in userData.');
            }

            console.log('User ID:', userId); // Debugging log for user ID
        } catch (error) {
            console.error('Error parsing userData or fetching userId:', error);
            alert('Invalid authentication details. Redirecting to login.');
            navigate('/login'); // Redirect to login page
        }
    }, [navigate]);

    const handleInputChange = (modal, field, value) => {
        setFormData((prev) => ({
            ...prev,
            [modal]: { ...prev[modal], [field]: value },
        }));
    };

    const handleFileChange = (modal, file) => {
        setFormData((prev) => ({
            ...prev,
            [modal]: { ...prev[modal], file },
        }));
    };

    const toggleModal = (modal) => {
        // Reset form data when opening a modal
        if (!showModal[modal]) {
            setFormData(prev => ({ ...prev, [modal]: initialFormData[modal] }));
        }
        setShowModal((prev) => ({ ...prev, [modal]: !prev[modal] }));
    };

    const handleSubmit = async (modal) => {
        const endpointMap = {
            incident: `${API_BASE_URL}/api/hssm/incidents`,
            asset: `${API_BASE_URL}/api/hssm/assets`,
            task: `${API_BASE_URL}/api/hssm/tasks`,
            meterReading: `${API_BASE_URL}/api/hssm/meterReadings`,
            reportUpload: `${API_BASE_URL}/api/hssm/reports`,
        };

        const data = new FormData();
        const currentFormData = formData[modal];
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');

        if (!token || !userData) {
            alert('Authentication error. Please log in again.');
            return;
        }

        const parsedUserData = JSON.parse(userData);
        const userId = parsedUserData.id;

        if (!userId) {
            alert('User ID is missing. Please log in again.');
            return;
        }

        data.append('userId', userId);

        for (const key in currentFormData) {
            if (key === 'file' && currentFormData[key]) {
                data.append(key, currentFormData[key]);
            } else if (key !== 'file' && currentFormData[key] !== null && currentFormData[key] !== undefined) {
                data.append(key, currentFormData[key]);
            }
        }

        if (modal === 'meterReading') {
            if (!currentFormData.location || !currentFormData.reading || !currentFormData.date) {
                alert('Location, Reading, and Date are required for Meter Reading.');
                return;
            }
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(endpointMap[modal], {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: data,
            });

            if (response.ok) {
                alert(`${modal.charAt(0).toUpperCase() + modal.slice(1).replace('Upload', '')} added successfully!`);
                toggleModal(modal);
                fetchData(); // Refresh dashboard data to reflect changes in cards
            } else {
                const errorData = await response.json();
                console.error(`Failed to add ${modal}:`, errorData);
                setError(`Failed to add ${modal}: ${errorData.message || response.statusText}`);
                alert(`Failed to add ${modal}. ${errorData.message || ''}`);
            }
        } catch (err) {
            console.error(`Error adding ${modal}:`, err);
            setError(`An error occurred while adding ${modal}.`);
            alert(`An error occurred while adding ${modal}.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('Authentication details missing. Please log in again.');
            }

            const userData = localStorage.getItem('userData');
            const parsedUserData = JSON.parse(userData);
            const userId = parsedUserData.id;

            if (!userId) {
                throw new Error('User ID is missing. Please log in again.');
            }

            const response = await fetch(`${API_BASE_URL}/api/hssm/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId,
                    startDate: dateRange.start,
                    endDate: dateRange.end,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate report.');
            }

            const data = await response.json();
            if (data.report) {
                setReportPreview(data.report);
                setShowReportPreviewModal(true);
            } else {
                throw new Error('No report data received.');
            }
        } catch (error) {
            console.error('Error generating report:', error.message);
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Modal Content Renderer ---
    const renderModalContent = (modalKey) => {
        const modalTitle = `Add ${modalKey.charAt(0).toUpperCase() + modalKey.slice(1).replace('Upload', ' Report')}`;
        const currentFields = formData[modalKey];

        return (
            <>
                {/* Modal Header */}
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" component="h2">
                        {modalTitle}
                    </Typography>
                    <IconButton onClick={() => toggleModal(modalKey)} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Modal Body with Scrolling */}
                <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
                    <Grid container spacing={2}>
                        {Object.keys(currentFields).map((field) => {
                             const label = field.charAt(0).toUpperCase() + field.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').slice(1); // Better label formatting

                            // --- Specific Field Types ---
                             if (field === 'priority') {
                                return (
                                    <Grid item xs={12} key={field}>
                                        <TextField
                                            select
                                            label="Priority"
                                            fullWidth
                                            value={currentFields.priority}
                                            onChange={(e) => handleInputChange(modalKey, field, e.target.value)}
                                            variant="outlined" // Consistent variant
                                        >
                                            <MenuItem value="Low">Low</MenuItem>
                                            <MenuItem value="Medium">Medium</MenuItem>
                                            <MenuItem value="High">High</MenuItem>
                                        </TextField>
                                    </Grid>
                                );
                            }

                             if (field === 'date' || field === 'dueDate') {
                                return (
                                    <Grid item xs={12} sm={6} key={field}>
                                        <TextField
                                            label={label}
                                            type="date"
                                            fullWidth
                                            value={currentFields[field]}
                                            onChange={(e) => handleInputChange(modalKey, field, e.target.value)}
                                            InputLabelProps={{ shrink: true }} // Important for date fields
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <CalendarTodayIcon fontSize="small" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            variant="outlined"
                                        />
                                    </Grid>
                                );
                            }

                             if (field === 'category' && modalKey === 'asset') {
                                return (
                                    <Grid item xs={12} sm={6} key={field}>
                                        <TextField
                                            select
                                            label="Category"
                                            fullWidth
                                            value={currentFields.category}
                                            onChange={(e) => handleInputChange(modalKey, 'category', e.target.value)}
                                            variant="outlined"
                                        >
                                            <MenuItem value="Fixed Assets">Fixed Assets</MenuItem>
                                            <MenuItem value="Consumables">Consumables</MenuItem>
                                            {/* Add more categories as needed */}
                                        </TextField>
                                    </Grid>
                                );
                            }

                             if (field === 'file') {
                                return (
                                    <Grid item xs={12} key={field}>
                                         <Button
                                            variant="outlined"
                                            component="label"
                                            fullWidth
                                            startIcon={<AddCircleOutlineIcon />}
                                        >
                                            {currentFields.file ? `File: ${currentFields.file.name}` : 'Upload File (Optional)'}
                                            <input
                                                type="file"
                                                hidden
                                                onChange={(e) => handleFileChange(modalKey, e.target.files[0])}
                                            />
                                        </Button>
                                         {currentFields.file && (
                                             <Typography variant="caption" display="block" sx={{mt: 1, textAlign: 'center'}}>
                                                {currentFields.file.name} ({(currentFields.file.size / 1024).toFixed(1)} KB)
                                             </Typography>
                                         )}
                                    </Grid>
                                );
                            }

                             // --- Default Text Field ---
                             // Make description fields larger
                             const isDescription = field.toLowerCase().includes('description') || field.toLowerCase().includes('records');
                             return (
                                <Grid item xs={12} sm={isDescription ? 12 : 6} key={field}>
                                    <TextField
                                        label={label}
                                        fullWidth
                                        multiline={isDescription}
                                        rows={isDescription ? 3 : 1}
                                        value={currentFields[field]}
                                        onChange={(e) => handleInputChange(modalKey, field, e.target.value)}
                                        type={field === 'reading' ? 'number' : 'text'} // Specific type for reading
                                        variant="outlined" // Consistent variant
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box>

                {/* Modal Footer */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'right' }}>
                    <Button
                        variant="outlined"
                        onClick={() => toggleModal(modalKey)}
                        sx={{ mr: 1 }}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleSubmit(modalKey)}
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isLoading ? 'Submitting...' : 'Submit'}
                    </Button>
                </Box>
            </>
        );
    };


     // --- PDF Download ---
     const handleDownloadReport = () => {
        if (!reportPreview) {
            alert("No report content available to download. Please generate or edit the report first.");
            return;
        }
        generatePDFReport(reportPreview);
        setShowReportPreviewModal(false); // Close modal after download starts
    };

    const generatePDFReport = (content) => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 15;
        let yPos = margin + 10; // Start position below title

        // --- Header ---
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Weekly Technical Report', pageWidth / 2, margin, { align: 'center' });

         // --- Date Range ---
         if (dateRange.start && dateRange.end) {
             doc.setFontSize(10);
             doc.setFont(undefined, 'normal');
             doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, pageWidth / 2, margin + 6, { align: 'center' });
             yPos += 6; // Adjust starting Y pos
         }

        // --- Content ---
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');

        // Split text into lines respecting margins
        const splitText = doc.splitTextToSize(content, pageWidth - margin * 2);

        splitText.forEach(line => {
            if (yPos > pageHeight - margin) { // Check if content exceeds page height
                doc.addPage();
                yPos = margin; // Reset Y position for new page
            }
            doc.text(line, margin, yPos);
            yPos += 7; // Line height (adjust as needed)
        });

        // --- Footer (Example: Page Number) ---
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        }


        // --- Save ---
        doc.save(`Technical_Report_${dateRange.start}_to_${dateRange.end}.pdf`);
    };

     const handleDateRangeChange = (field, value) => {
        setDateRange((prev) => ({ ...prev, [field]: value }));
    };

    // --- Main Render ---
    return (
        <Container maxWidth="xl" sx={{ py: 4 }}> {/* Wider container, more padding */}
            <Typography variant={isSmallScreen ? "h5" : "h4"} component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4, fontWeight: 'bold' }}>
                Maintenance Dashboard
            </Typography>

             {/* Optional: Display general errors */}
             {error && !isFetching && (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
             )}

            {/* --- Dashboard Stats --- */}
            {isFetching ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StyledDashboardCard>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Total Assets
                            </Typography>
                            <Typography variant="h4" component="p" sx={{ fontWeight: 'medium' }}>
                                {dashboardData.totalAssets}
                            </Typography>
                        </StyledDashboardCard>
                    </Grid>
                     <Grid item xs={12} sm={6} md={3}>
                        <StyledDashboardCard>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Pending Incidents
                            </Typography>
                            <Typography variant="h4" component="p" sx={{ fontWeight: 'medium', color: dashboardData.pendingIncidents > 0 ? 'error.main' : 'inherit' }}>
                                {dashboardData.pendingIncidents}
                            </Typography>
                        </StyledDashboardCard>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StyledDashboardCard>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Open Tasks
                            </Typography>
                             <Typography variant="h4" component="p" sx={{ fontWeight: 'medium' }}>
                                {dashboardData.maintenanceTasks}
                            </Typography>
                        </StyledDashboardCard>
                    </Grid>
                    <Grid item xs={12} sm={12} md={6}>
                        <StyledDashboardCard sx={{ height: '100%' }}> {/* Larger card for meter readings */}
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Meter Readings Overview
                            </Typography>
                            {dashboardData.meterReadings && dashboardData.meterReadings.length > 0 ? (
                                <Box sx={{ height: 300, width: '100%', mt: 1 }}> {/* Increased height for better visualization */}
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={dashboardData.meterReadings}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {dashboardData.meterReadings.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value, name) => [`${value} readings`, name]} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                    No meter readings recorded yet.
                                </Typography>
                            )}
                            {renderDayColorKey()}
                        </StyledDashboardCard>
                    </Grid>
                </Grid>
            )}

            {/* --- Action Buttons Sections --- */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Section 1: Add Data Actions */}
                <Grid item xs={12} md={6}>
                     <Paper elevation={2} sx={{ p: 3 }}>
                         <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>Quick Add</Typography>
                         <Grid container spacing={2}>
                             <Grid item xs={12} sm={6}>
                                <Button fullWidth variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={() => toggleModal('incident')}>Add Incident</Button>
                             </Grid>
                             <Grid item xs={12} sm={6}>
                                 <Button fullWidth variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={() => toggleModal('asset')}>Add Asset</Button>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button fullWidth variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={() => toggleModal('task')}>Add Task</Button>
                             </Grid>
                            <Grid item xs={12} sm={6}>
                                 <Button fullWidth variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={() => toggleModal('meterReading')}>Add Meter Reading</Button>
                            </Grid>
                             <Grid item xs={12} sm={6}>
                                 <Button fullWidth variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={() => toggleModal('reportUpload')}>Upload Report</Button>
                            </Grid>
                             <Grid item xs={12} sm={6}>
                                <Button fullWidth variant="contained" color="info" onClick={() => window.location.href = '/total'}>
                                     Available Services
                                 </Button>
                            </Grid>
                         </Grid>
                     </Paper>
                </Grid>

                {/* Section 2: Reporting Actions */}
                <Grid item xs={12} md={6}>
                     <Paper elevation={2} sx={{ p: 3 }}>
                         <Typography variant="h6" gutterBottom>Generate Weekly Report</Typography>
                         <Grid container spacing={2} sx={{ mb: 2 }}>
                             <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    fullWidth
                                    value={dateRange.start}
                                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    variant="outlined"
                                    size="small" // Smaller date inputs
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="End Date"
                                    type="date"
                                    fullWidth
                                    value={dateRange.end}
                                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    variant="outlined"
                                     size="small"
                                />
                             </Grid>
                         </Grid>
                         <Button
                             variant="contained"
                             color="secondary"
                             fullWidth
                             onClick={handleGenerateReport}
                             disabled={isLoading || !dateRange.start || !dateRange.end} // Disable if loading or dates missing
                             startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AssessmentIcon />}
                             sx={{ mb: 1 }} // Add margin bottom
                         >
                             {isLoading ? 'Generating...' : 'Generate Report'}
                         </Button>
                         {/* Button to download the currently previewed/edited report */}
                         <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            onClick={handleDownloadReport}
                            disabled={!reportPreview} // Disable if no preview exists
                            startIcon={<DownloadIcon />}
                         >
                             Download Generated Report
                         </Button>
                     </Paper>
                </Grid>
            </Grid>

            {/* --- Modals --- */}
            {Object.keys(showModal).map((modalKey) => (
                <Modal
                    key={modalKey}
                    open={showModal[modalKey]}
                    onClose={() => !isLoading && toggleModal(modalKey)} // Prevent closing while submitting
                    aria-labelledby={`modal-title-${modalKey}`}
                    aria-describedby={`modal-description-${modalKey}`}
                >
                    <Box sx={getModalStyle(theme)}>{renderModalContent(modalKey)}</Box>
                </Modal>
            ))}

            {/* Report Preview/Edit Modal */}
            <Modal
                 open={showReportPreviewModal}
                 onClose={() => setShowReportPreviewModal(false)}
                 aria-labelledby="report-preview-modal-title"
             >
                <Box sx={{ ...getModalStyle(theme), width: { xs: '95%', sm: '85%', md: '70%' } }}> {/* Wider modal for editing */}
                     {/* Header */}
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                         <Typography variant="h6" component="h2" id="report-preview-modal-title">
                             <EditIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Edit & Download Report
                        </Typography>
                        <IconButton onClick={() => setShowReportPreviewModal(false)} size="small" sx={{ color: 'primary.contrastText' }}>
                             <CloseIcon />
                        </IconButton>
                    </Box>

                     {/* Body */}
                     <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1, bgcolor: 'grey.100' }}>
                         <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                             Review and edit the generated report content below before downloading.
                         </Typography>
                        <TextField
                            multiline
                            fullWidth
                             rows={15} // Adjust rows as needed
                            value={reportPreview}
                            onChange={(e) => setReportPreview(e.target.value)} // Allow editing
                            variant="outlined"
                             sx={{ bgcolor: 'background.paper' }} // White background for text area
                        />
                    </Box>

                     {/* Footer */}
                     <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'right', bgcolor: 'grey.50' }}>
                        <Button variant="outlined" onClick={() => setShowReportPreviewModal(false)} sx={{ mr: 1 }}>
                            Cancel
                        </Button>
                         <Button
                            variant="contained"
                            color="success"
                            onClick={handleDownloadReport}
                            startIcon={<DownloadIcon />}
                            disabled={!reportPreview} // Disable if somehow empty
                         >
                            Download as PDF
                        </Button>
                     </Box>
                </Box>
            </Modal>

        </Container>
    );
};

export default Hssm;