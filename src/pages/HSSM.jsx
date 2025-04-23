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
    useTheme, // To access theme colors
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Collapse,
    AppBar,
    Toolbar,
    Avatar,
    CssBaseline,
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close'; // Icon for modal close button
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // Icon for Add buttons
import AssessmentIcon from '@mui/icons-material/Assessment'; // Icon for Report button
import DownloadIcon from '@mui/icons-material/Download'; // Icon for Download button
import EditIcon from '@mui/icons-material/Edit'; // Icon for Edit Report modal
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';
import ReportIcon from '@mui/icons-material/Report';
import DevicesIcon from '@mui/icons-material/Devices';
import Drawer from '@mui/material/Drawer'; // Import Drawerimport Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import ncmtcLogo from '../components/assests/ncmtc.png'; 

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'; // Added Tooltip
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Optional: for better table formatting in PDF if needed
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend as RechartsLegend } from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Provide a fallback for local dev

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

// --- Utility Function to determine Hospital Level Services ---
const getHospitalLevelServices = (level) => {
    const baseStyles = {
        borderLeft: '4px solid',
        pl: 2,
        py: 1,
        mb: 1,
        borderRadius: 1,
        bgcolor: 'background.paper',
        boxShadow: 1,
    };

    const levelColors = {
        1: '#4caf50', // Green for primary care
        2: '#2196f3', // Blue for basic services
        3: '#ff9800', // Orange for sub-county
        4: '#9c27b0', // Purple for county
        5: '#f44336', // Red for regional
        6: '#gold',   // Gold for national
    };

    const services = {
        1: [
            { title: "Primary Healthcare", items: ["Outpatient services", "Preventive healthcare", "Maternal and child health"] },
            { title: "Basic Services", items: ["HIV testing and counseling", "First aid", "Health education"] },
            { title: "Community", items: ["Health promotion", "Community outreach programs", "Basic health monitoring"] }
        ],
        2: [
            { title: "Emergency Care", items: ["Basic emergency services", "Minor surgical procedures", "Basic trauma care"] },
            { title: "Clinical Services", items: ["Laboratory services", "Pharmacy services", "Dental services"] },
            { title: "Maternal Care", items: ["Basic maternity services", "Antenatal care", "Immunization services"] }
        ],
        3: [
            { title: "Specialized Care", items: ["General surgery", "General medicine", "Basic pediatrics"] },
            { title: "Emergency & Critical", items: ["Comprehensive emergency", "Basic orthopedics", "24-hour inpatient"] },
            { title: "Diagnostics", items: ["Basic imaging (X-ray, ultrasound)", "Comprehensive lab", "Basic rehabilitation"] }
        ],
        4: [
            { title: "Advanced Care", items: ["Specialized clinics", "Advanced surgery", "Comprehensive pediatrics"] },
            { title: "Critical Care", items: ["ICU/HDU services", "Blood bank", "Advanced imaging (CT)"] },
            { title: "Specialized Services", items: ["Mental health", "Comprehensive rehab", "Teaching programs"] }
        ],
        5: [
            { title: "Tertiary Care", items: ["Advanced medical procedures", "Specialized surgery", "Advanced cardiac"] },
            { title: "Advanced Diagnostics", items: ["MRI services", "Specialized radiology", "Advanced lab"] },
            { title: "Research & Training", items: ["Research programs", "Equipment center", "Specialized training"] }
        ],
        6: [
            { title: "Super-Specialized", items: ["Transplant services", "Advanced neurosurgery", "Comprehensive cancer"] },
            { title: "National Center", items: ["Policy development", "International collaboration", "Advanced research"] },
            { title: "Excellence Hub", items: ["Medical innovation", "Specialized equipment", "National training"] }
        ]
    };

    const renderService = (service) => (
        <Box key={service.title} sx={{ ...baseStyles, borderLeftColor: levelColors[level] }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>{service.title}</Typography>
            <Grid container spacing={1}>
                {service.items.map((item, idx) => (
                    <Grid item xs={12} key={idx}>
                        <Typography variant="body2" sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            '&:before': {
                                content: '"•"',
                                mr: 1,
                                color: levelColors[level]
                            }
                        }}>
                            {item}
                        </Typography>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );

    return services[level]?.map(renderService) || [];
};


const Hssm = () => {
    const currentTheme = useTheme();
    // Removed unused isSmallScreen variable
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
    const [reportPreview, setReportPreview] = useState('');
    // Removed unused error state
    const [showReportPreviewModal, setShowReportPreviewModal] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    // Removed unused error state

    const [hospitalLevel, setHospitalLevel] = useState(4); // Default hospital level
    const [open, setOpen] = useState(true); // State for sidebar open
    const [darkMode, setDarkMode] = useState(false);

    const handleThemeToggle = () => setDarkMode((prev) => !prev);

    const appTheme = useMemo(() => createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: { main: '#1f2937' }, // dark
            secondary: { main: '#3b82f6' }, // blue
            background: {
                default: darkMode ? '#18122B' : '#f4f6fa',
                paper: darkMode ? '#23213a' : '#fff',
            },
            text: {
                primary: darkMode ? '#fff' : '#0052cc',
                secondary: darkMode ? '#fff' : '#ff4081',
            },
        },
        typography: {
            fontFamily: "'Times New Roman', Times, serif",
        },
    }), [darkMode]);

    const handleClick = () => {
        setOpen((prev) => !prev);
    };

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
        // Removed isFetching setter
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');

        if (!token || !userData) {
            // Removed isFetching setter
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
        } finally {
            setIsLoading(false); // Use the existing isLoading state instead
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
                alert(`Failed to add ${modal}. ${errorData.message || ''}`);
            }
        } catch (err) {
            console.error(`Error adding ${modal}:`, err);
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
            
            console.log('Starting report generation...', {
                startDate: dateRange.start,
                endDate: dateRange.end
            });
            
            const response = await fetch(`${API_BASE_URL}/api/hssm/report/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    startDate: dateRange.start,
                    endDate: dateRange.end,
                }),
            });

            console.log('Report API Response status:', response.status);
            const data = await response.json();
            console.log('Report API Response data:', data);

            if (response.ok && data.success && data.report) {
                console.log('Report generated successfully');
                setReportPreview(data.report);
                setShowReportPreviewModal(true);
            } else {
                throw new Error(data.message || `Failed to generate report: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Report generation error:', error);
            alert(`Failed to generate report: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Stepper State for Multi-Step Forms ---
    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Basic Info', 'Details', 'Upload'];

    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);
    // Removed unused handleReset function

    // --- Enhanced Modal Content Renderer with Stepper for Asset Modal ---
    const renderModalContent = (modalKey) => {
        const modalTitle = `Add ${modalKey.charAt(0).toUpperCase() + modalKey.slice(1).replace('Upload', ' Report')}`;
        const currentFields = formData[modalKey];

        if (modalKey === 'asset') {
            return (
                <>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="h6" component="h2">Add Asset</Typography>
                        <IconButton aria-label="Close modal" onClick={() => toggleModal(modalKey)} size="small" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleModal(modalKey); }}><CloseIcon /></IconButton>
                    </Box>
                    <Stepper activeStep={activeStep} alternativeLabel sx={{ my: 2 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
                        {activeStep === 0 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Name" fullWidth value={formData.asset.name} onChange={e => handleInputChange('asset', 'name', e.target.value)} required />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Serial Number" fullWidth value={formData.asset.serialNumber} onChange={e => handleInputChange('asset', 'serialNumber', e.target.value)} required />
                                </Grid>
                            </Grid>
                        )}
                        {activeStep === 1 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField select label="Category" fullWidth value={formData.asset.category} onChange={e => handleInputChange('asset', 'category', e.target.value)}>
                                        <MenuItem value="Fixed Assets">Fixed Assets</MenuItem>
                                        <MenuItem value="Consumables">Consumables</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Location" fullWidth value={formData.asset.location} onChange={e => handleInputChange('asset', 'location', e.target.value)} required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField label="Service Records" fullWidth multiline rows={2} value={formData.asset['service records']} onChange={e => handleInputChange('asset', 'service records', e.target.value)} />
                                </Grid>
                            </Grid>
                        )}
                        {activeStep === 2 && (
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Button variant="outlined" component="label" fullWidth startIcon={<AddCircleOutlineIcon />}>
                                        {formData.asset.file ? `File: ${formData.asset.file.name}` : 'Upload File (Optional)'}
                                        <input type="file" hidden onChange={e => handleFileChange('asset', e.target.files[0])} />
                                    </Button>
                                    {formData.asset.file && (
                                        <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                                            {formData.asset.file.name} ({(formData.asset.file.size / 1024).toFixed(1)} KB)
                                        </Typography>
                                    )}
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'right' }}>
                        <Button onClick={handleBack} disabled={activeStep === 0} sx={{ mr: 1 }}>Back</Button>
                        {activeStep < steps.length - 1 ? (
                            <Button variant="contained" color="primary" onClick={handleNext}>Next</Button>
                        ) : (
                            <Button variant="contained" color="primary" aria-label="Submit form" onClick={() => handleSubmit('asset')} startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null} disabled={isLoading} tabIndex={0} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !isLoading) handleSubmit('asset'); }}>
                                {isLoading ? 'Submitting...' : 'Submit'}
                            </Button>
                        )}
                    </Box>
                </>
            );
        }

        return (
            <>
                {/* Modal Header */}
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" component="h2">
                        {modalTitle}
                    </Typography>
                    <IconButton aria-label="Close modal" onClick={() => toggleModal(modalKey)} size="small" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleModal(modalKey); }}>
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
                        aria-label="Submit form"
                        onClick={() => handleSubmit(modalKey)}
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                        tabIndex={0}
                        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !isLoading) handleSubmit(modalKey); }}
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

    // --- Advanced Chart Data Preparation ---
    const [meterReadingTrend, setMeterReadingTrend] = useState([]);

    const fetchMeterReadingTrend = useCallback(async () => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');
        if (!token || !userData) return;
        const parsedUserData = JSON.parse(userData);
        const userId = parsedUserData.id;
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const response = await fetch(`${API_BASE_URL}/api/hssm/meterReadings/trend?userId=${userId}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch meter reading trend.');
            const trendData = await response.json();
            setMeterReadingTrend(trendData);
        } catch (err) {
            setMeterReadingTrend([]);
        }
    }, []);

    useEffect(() => {
        fetchMeterReadingTrend();
    }, [fetchMeterReadingTrend]);

    // --- Hospital Profile Section ---
    const [hospitalProfile, setHospitalProfile] = useState({ mission: '', vision: '', serviceCharter: '' });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileEdit, setProfileEdit] = useState(false);

    useEffect(() => {
      const fetchProfile = async () => {
        setProfileLoading(true);
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_BASE_URL}/api/hssm/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setHospitalProfile({
              mission: data.mission || '',
              vision: data.vision || '',
              serviceCharter: data.serviceCharter || '',
            });
          }
        } finally {
          setProfileLoading(false);
        }
      };
      fetchProfile();
    }, []);

    const handleProfileChange = (e) => {
      setHospitalProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleProfileSave = async () => {
      setProfileLoading(true);
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/api/hssm/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(hospitalProfile),
        });
        setProfileEdit(false);
      } finally {
        setProfileLoading(false);
      }
    };

    // --- Main Render ---
    const [drawerOpen, setDrawerOpen] = useState(false);
    const handleDrawerOpen = () => setDrawerOpen(true);
    const handleDrawerClose = () => setDrawerOpen(false);

    // --- Settings Modal State ---
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsTab, setSettingsTab] = useState(0); // 0: Profile, 1: Preferences, 2: Security
    const [settingsFeedback, setSettingsFeedback] = useState('');
    const handleSettingsOpen = () => setShowSettingsModal(true);
    const handleSettingsClose = () => {
        setShowSettingsModal(false);
        setSettingsFeedback('');
    };
    // --- Settings Form State (example fields) ---
    const [settingsProfile, setSettingsProfile] = useState({
        name: '',
        email: '',
    });
    const [settingsPassword, setSettingsPassword] = useState({
        current: '',
        new: '',
        confirm: '',
    });
    // Example: Load user profile info on open
    useEffect(() => {
        if (showSettingsModal) {
            // Simulate fetch
            setSettingsProfile({ name: 'John Doe', email: 'john@example.com' });
        }
    }, [showSettingsModal]);
    // --- Settings Modal Content ---
    const renderSettingsContent = () => (
        <Box sx={{ width: { xs: '100%', sm: 500 }, p: 0 }}>
            <Box sx={{
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
            }}>
                <Typography variant="h6">Settings</Typography>
                <IconButton onClick={handleSettingsClose} sx={{ color: 'primary.contrastText' }}><CloseIcon /></IconButton>
            </Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex' }}>
                <Button onClick={() => setSettingsTab(0)} color={settingsTab === 0 ? 'primary' : 'inherit'} sx={{ flex: 1, borderRadius: 0, fontWeight: settingsTab === 0 ? 'bold' : 'normal' }}>Profile</Button>
                <Button onClick={() => setSettingsTab(1)} color={settingsTab === 1 ? 'primary' : 'inherit'} sx={{ flex: 1, borderRadius: 0, fontWeight: settingsTab === 1 ? 'bold' : 'normal' }}>Preferences</Button>
                <Button onClick={() => setSettingsTab(2)} color={settingsTab === 2 ? 'primary' : 'inherit'} sx={{ flex: 1, borderRadius: 0, fontWeight: settingsTab === 2 ? 'bold' : 'normal' }}>Security</Button>
            </Box>
            <Box sx={{ p: 3 }}>
                {settingsTab === 0 && (
                    <Box component="form" autoComplete="off" onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                            const token = localStorage.getItem('token');
                            const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify(settingsProfile),
                            });
                            if (!res.ok) throw new Error((await res.json()).message || 'Failed to update profile');
                            setSettingsFeedback('Profile updated!');
                        } catch (err) {
                            setSettingsFeedback(err.message);
                        }
                    }}>
                        <TextField label="Name" fullWidth sx={{ mb: 2 }} value={settingsProfile.name} onChange={e => setSettingsProfile(p => ({ ...p, name: e.target.value }))} />
                        <TextField label="Email" fullWidth sx={{ mb: 2 }} value={settingsProfile.email} onChange={e => setSettingsProfile(p => ({ ...p, email: e.target.value }))} />
                        <Button variant="contained" color="primary" fullWidth type="submit">Save Profile</Button>
                    </Box>
                )}
                {settingsTab === 1 && (
                    <Box>
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>Theme</Typography>
                        <Button variant="outlined" onClick={handleThemeToggle} sx={{ mb: 2 }} startIcon={darkMode ? <Brightness7Icon /> : <Brightness4Icon />}>{darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</Button>
                        <Button variant="contained" color="error" fullWidth sx={{ mt: 2 }} onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('userData');
                            fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
                            window.location.href = '/login';
                        }}>Logout</Button>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>More preferences coming soon...</Typography>
                    </Box>
                )}
                {settingsTab === 2 && (
                    <Box component="form" autoComplete="off" onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                            const token = localStorage.getItem('token');
                            const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ current: settingsPassword.current, newPassword: settingsPassword.new }),
                            });
                            if (!res.ok) throw new Error((await res.json()).message || 'Failed to change password');
                            setSettingsFeedback('Password changed!');
                        } catch (err) {
                            setSettingsFeedback(err.message);
                        }
                    }}>
                        <TextField label="Current Password" type="password" fullWidth sx={{ mb: 2 }} value={settingsPassword.current} onChange={e => setSettingsPassword(p => ({ ...p, current: e.target.value }))} />
                        <TextField label="New Password" type="password" fullWidth sx={{ mb: 2 }} value={settingsPassword.new} onChange={e => setSettingsPassword(p => ({ ...p, new: e.target.value }))} />
                        <TextField label="Confirm New Password" type="password" fullWidth sx={{ mb: 2 }} value={settingsPassword.confirm} onChange={e => setSettingsPassword(p => ({ ...p, confirm: e.target.value }))} />
                        <Button variant="contained" color="primary" fullWidth type="submit">Change Password</Button>
                    </Box>
                )}
                {settingsFeedback && <Typography color={settingsFeedback.includes('updated') || settingsFeedback.includes('changed') ? "success.main" : "error.main"} sx={{ mt: 2 }}>{settingsFeedback}</Typography>}
            </Box>
        </Box>
    );

    // --- View Assets Modal State ---
    const [showAssetsModal, setShowAssetsModal] = useState(false);
    const [assets, setAssets] = useState([]);
    const [assetsLoading, setAssetsLoading] = useState(false);
    const [assetsError, setAssetsError] = useState('');
    const [assetsSearch, setAssetsSearch] = useState('');

    const handleViewAssetsOpen = async () => {
        setShowAssetsModal(true);
        setAssetsLoading(true);
        setAssetsError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/hssm/assets`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch assets');
            const data = await res.json();
            setAssets(data);
        } catch (err) {
            setAssetsError(err.message);
        } finally {
            setAssetsLoading(false);
        }
    };
    const handleViewAssetsClose = () => setShowAssetsModal(false);

    // --- View Reports Modal State ---
    const [showReportsModal, setShowReportsModal] = useState(false);
    const [reports, setReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [reportsError, setReportsError] = useState('');
    const [reportsSearch, setReportsSearch] = useState('');
    const [editReport, setEditReport] = useState(null); // For editing
    const [editReportContent, setEditReportContent] = useState('');

    const handleViewReportsOpen = async () => {
        setShowReportsModal(true);
        setReportsLoading(true);
        setReportsError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/hssm/reports`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch reports');
            const data = await res.json();
            setReports(data);
        } catch (err) {
            setReportsError(err.message);
        } finally {
            setReportsLoading(false);
        }
    };
    const handleViewReportsClose = () => setShowReportsModal(false);

    const handleEditReport = (report) => {
        setEditReport(report);
        setEditReportContent(report.content || '');
    };
    const handleEditReportSave = async () => {
        if (!editReport) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/hssm/reports/${editReport._id || editReport.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: editReportContent }),
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to update report');
            setEditReport(null);
            setEditReportContent('');
            handleViewReportsOpen(); // Refresh list
        } catch (err) {
            alert(err.message);
        }
    };
    const handleDeleteReport = async (reportId) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/hssm/reports/${reportId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete report');
            handleViewReportsOpen(); // Refresh list
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <ThemeProvider theme={appTheme}>
            <CssBaseline />
            <AppBar position="fixed" color="default" elevation={2} sx={{ zIndex: currentTheme.zIndex.drawer + 1, bgcolor: darkMode ? 'primary.main' : 'secondary.main', color: darkMode ? 'secondary.main' : 'primary.contrastText' }}>
                <Toolbar>
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                        <img src={ncmtcLogo} alt="Logo" style={{ height: 40, marginRight: 16 }} />
                        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', letterSpacing: 1, color: darkMode ? 'secondary.main' : 'primary.contrastText' }}>
                            HSSM Provider
                        </Typography>
                    </Box>
                    <IconButton
                        edge="end"
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerOpen}
                        sx={{ ml: 2 }}
                    >
                        <DevicesIcon />
                    </IconButton>
                    <Avatar sx={{ ml: 2, bgcolor: darkMode ? 'secondary.main' : 'primary.main', color: darkMode ? 'primary.main' : 'secondary.contrastText' }}>U</Avatar>
                </Toolbar>
            </AppBar>
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={handleDrawerClose}
                PaperProps={{ sx: { width: 260 } }}
            >
                <Box
                    sx={{ width: 260 }}
                    role="presentation"
                    onClick={handleDrawerClose}
                    onKeyDown={handleDrawerClose}
                >
                    <Card>
                        <CardContent>
                            <List>
                                <ListItem button>
                                    <ListItemIcon>
                                        <DashboardIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Dashboard" />
                                </ListItem>
                                <ListItem button onClick={handleClick}>
                                    <ListItemIcon>
                                        <AssignmentIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Assets" />
                                    {open ? <ExpandLess /> : <ExpandMore />}
                                </ListItem>
                                <Collapse in={open} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        <ListItem button sx={{ pl: 4 }} onClick={handleViewAssetsOpen}>
                                            <ListItemIcon>
                                                <DevicesIcon />
                                            </ListItemIcon>
                                            <ListItemText primary="View Assets" />
                                        </ListItem>
                                    </List>
                                </Collapse>
                                <ListItem button onClick={handleViewReportsOpen}>
                                    <ListItemIcon>
                                        <ReportIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Reports" />
                                </ListItem>
                                <ListItem button onClick={handleSettingsOpen} sx={{ mt: 2 }}>
                                    <ListItemIcon>
                                        <SettingsIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Settings" />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Box>
            </Drawer>
            <Toolbar />
            <Container maxWidth="xl" sx={{ py: 0.25 }}>
                <Box sx={{ mb: 2, p: 2, background: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Hospital Profile</Typography>
                  {profileEdit ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Mission"
                          name="mission"
                          value={hospitalProfile.mission}
                          onChange={handleProfileChange}
                          fullWidth
                          multiline
                          minRows={2}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Vision"
                          name="vision"
                          value={hospitalProfile.vision}
                          onChange={handleProfileChange}
                          fullWidth
                          multiline
                          minRows={2}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Service Charter"
                          name="serviceCharter"
                          value={hospitalProfile.serviceCharter}
                          onChange={handleProfileChange}
                          fullWidth
                          multiline
                          minRows={2}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button variant="contained" color="primary" onClick={handleProfileSave} disabled={profileLoading} sx={{ mr: 1 }}>Save</Button>
                        <Button variant="outlined" onClick={() => setProfileEdit(false)} disabled={profileLoading}>Cancel</Button>
                      </Grid>
                    </Grid>
                  ) : (
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2"><b>Mission:</b> {hospitalProfile.mission || <i>Not set</i>}</Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2"><b>Vision:</b> {hospitalProfile.vision || <i>Not set</i>}</Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2"><b>Service Charter:</b> {hospitalProfile.serviceCharter || <i>Not set</i>}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Button variant="outlined" onClick={() => setProfileEdit(true)} sx={{ mt: 1 }}>Edit</Button>
                      </Grid>
                    </Grid>
                  )}
                </Box>
                <Grid container spacing={3} sx={{ mb: 2, mt: 0.25, justifyContent: 'center', minHeight: 180 }}>
                    <Grid item xs={12} sm={4} md={4}>
                        <StyledDashboardCard
                            onClick={() => navigate('/assets')}
                            sx={{
                                background: 'linear-gradient(135deg, #2d2a4a 0%, #1a237e 100%)', // Blue gradient
                                color: 'secondary.contrastText',
                                cursor: 'pointer',
                                '&:hover': {
                                    transform: 'translateY(-6px) scale(1.03)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
                                },
                            }}
                            tabIndex={0}
                            aria-label="Total Assets"
                            role="button"
                        >
                            <DevicesIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Total Assets
                            </Typography>
                            <Typography variant="h4" component="p" sx={{ fontWeight: 'medium' }}>
                                {dashboardData.totalAssets}
                            </Typography>
                        </StyledDashboardCard>
                    </Grid>
                    <Grid item xs={12} sm={4} md={4}>
                        <StyledDashboardCard
                            onClick={() => navigate('/incidents')}
                            sx={{
                                background: 'linear-gradient(135deg, #fffde7 0%, #ffe082 100%)',
                                cursor: 'pointer',
                                '&:hover': {
                                    transform: 'translateY(-6px) scale(1.03)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
                                },
                            }}
                            tabIndex={0}
                            aria-label="Pending Incidents"
                            role="button"
                        >
                            <ReportIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Pending Incidents
                            </Typography>
                            <Typography variant="h4" component="p" sx={{ fontWeight: 'medium', color: dashboardData.pendingIncidents > 0 ? 'error.main' : 'inherit' }}>
                                {dashboardData.pendingIncidents}
                            </Typography>
                        </StyledDashboardCard>
                    </Grid>
                    <Grid item xs={12} sm={4} md={4}>
                        <StyledDashboardCard
                            onClick={() => navigate('/tasks')}
                            sx={{
                                background: 'linear-gradient(135deg, #e8f5e9 0%, #a5d6a7 100%)',
                                cursor: 'pointer',
                                '&:hover': {
                                    transform: 'translateY(-6px) scale(1.03)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
                                },
                            }}
                            tabIndex={0}
                            aria-label="Open Tasks"
                            role="button"
                        >
                            <AssignmentIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Open Tasks
                            </Typography>
                            <Typography variant="h4" component="p" sx={{ fontWeight: 'medium' }}>
                                {dashboardData.maintenanceTasks}
                            </Typography>
                        </StyledDashboardCard>
                    </Grid>
                </Grid>
                {/* Hospital Level Dropdown and Info Card */}
                <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 2 }}>
                    <TextField select label="Hospital Level" value={hospitalLevel} onChange={(e) => setHospitalLevel(parseInt(e.target.value, 10))} size="small" sx={{ maxWidth: 220 }}>
                        {[1, 2, 3, 4, 5, 6].map((level) => (
                            <MenuItem key={level} value={level}>Level {level}</MenuItem>
                        ))}
                    </TextField>
                    <Card sx={{ 
                        flex: 1, 
                        minWidth: 200,
                        maxHeight: 500,
                        overflow: 'auto',
                        bgcolor: 'background.default',
                        p: 2
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ 
                                borderBottom: '2px solid',
                                borderColor: theme => theme.palette.primary.main,
                                pb: 1,
                                mb: 2
                            }}>
                                Hospital Level {hospitalLevel} Services
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {getHospitalLevelServices(hospitalLevel)}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
                {/* Meter Readings Card and Trend Chart */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <StyledDashboardCard
                            onClick={() => navigate('/meter-readings')}
                            sx={{
                                background: 'linear-gradient(135deg, #6d071a 0%, #b71c1c 100%)', // Maroon gradient
                                color: 'primary.contrastText',
                                cursor: 'pointer',
                                minHeight: 400,
                                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                                '&:hover': {
                                    transform: 'translateY(-6px) scale(1.03)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
                                },
                            }}
                            tabIndex={0}
                            aria-label="Meter Readings Overview"
                            role="button"
                        >
                            <AssessmentIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Meter Readings Overview
                            </Typography>
                            {dashboardData.meterReadings && dashboardData.meterReadings.length > 0 ? (
                                <Box sx={{ height: 300, width: "100%", mt: 1 }}>
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
                                            <RechartsTooltip
                                                formatter={(value, name) => [`${value} readings`, name]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 2 }}
                                >
                                    No meter readings recorded yet.
                                </Typography>
                            )}
                            {renderDayColorKey()}
                        </StyledDashboardCard>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <StyledDashboardCard sx={{ height: 400 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Meter Readings Trend (Last 30 Days)
                            </Typography>
                            {meterReadingTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={meterReadingTrend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <RechartsTooltip />
                                        <RechartsLegend />
                                        <Line type="monotone" dataKey="reading" stroke="#1976d2" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                    No meter reading trend data available.
                                </Typography>
                            )}
                        </StyledDashboardCard>
                    </Grid>
                </Grid>
                {/* Quick Add and Report Generation Sections */}
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                Quick Add
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<AddCircleOutlineIcon />}
                                        onClick={() => toggleModal("incident")}
                                    >
                                        Add Incident
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<AddCircleOutlineIcon />}
                                        onClick={() => toggleModal("asset")}
                                    >
                                        Add Asset
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<AddCircleOutlineIcon />}
                                        onClick={() => toggleModal("task")}
                                    >
                                        Add Task
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<AddCircleOutlineIcon />}
                                        onClick={() => toggleModal("meterReading")}
                                    >
                                        Add Meter Reading
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<AddCircleOutlineIcon />}
                                        onClick={() => toggleModal("reportUpload")}
                                    >
                                        Upload Report
                                    </Button>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        color="info"
                                        onClick={() => (window.location.href = "/total")}
                                    >
                                        Available Services
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Generate Weekly Report
                            </Typography>
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Start Date"
                                        type="date"
                                        fullWidth
                                        value={dateRange.start}
                                        onChange={(e) => handleDateRangeChange("start", e.target.value)}
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
                                        onChange={(e) => handleDateRangeChange("end", e.target.value)}
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
                                startIcon={
                                    isLoading ? (
                                        <CircularProgress size={20} color="inherit" />
                                    ) : (
                                        <AssessmentIcon />
                                    )
                                }
                                sx={{ mb: 1 }} // Add margin bottom
                            >
                                {isLoading ? "Generating..." : "Generate Report"}
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
                {/* Modals and Report Preview Modal remain unchanged */}
                {/* --- Modals --- */}
                {Object.keys(showModal).map((modalKey) => (
                    <Modal
                        key={modalKey}
                        open={showModal[modalKey]}
                        onClose={() => !isLoading && toggleModal(modalKey)} // Prevent closing while submitting
                        aria-labelledby={`modal-title-${modalKey}`}
                        aria-describedby={`modal-description-${modalKey}`}
                    >
                        <Box sx={getModalStyle(currentTheme)}>
                            {renderModalContent(modalKey)}
                        </Box>
                    </Modal>
                ))}

                {/* Report Preview/Edit Modal */}
                <Modal
                    open={showReportPreviewModal}
                    onClose={() => setShowReportPreviewModal(false)}
                    aria-labelledby="report-preview-modal-title"
                >
                    <Box
                        sx={{
                            ...getModalStyle(currentTheme),
                            width: { xs: "95%", sm: "85%", md: "70%" },
                        }}
                    >
                        {/* Wider modal for editing */}
                        {/* Header */}
                        <Box
                            sx={{
                                p: 2,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderBottom: 1,
                                borderColor: "divider",
                                bgcolor: "primary.main",
                                color: "primary.contrastText",
                            }}
                        >
                            <Typography
                                variant="h6"
                                component="h2"
                                id="report-preview-modal-title"
                            >
                                <EditIcon sx={{ verticalAlign: "middle", mr: 1 }} /> Edit
                                & Download Report
                            </Typography>
                            <IconButton
                                aria-label="Close modal"
                                onClick={() => setShowReportPreviewModal(false)}
                                size="small"
                                sx={{ color: "primary.contrastText" }}
                                tabIndex={0}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowReportPreviewModal(false); }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>

                        {/* Body */}
                        <Box
                            sx={{
                                p: 3,
                                overflowY: "auto",
                                flexGrow: 1,
                                bgcolor: "grey.100",
                            }}
                        >
                            <Typography variant="body2" sx={{ mb: 1, fontStyle: "italic" }}>
                                Review and edit the generated report content below before
                                downloading.
                            </Typography>
                            <TextField
                                multiline
                                fullWidth
                                rows={15} // Adjust rows as needed
                                value={reportPreview}
                                onChange={(e) => setReportPreview(e.target.value)} // Allow editing
                                variant="outlined"
                                sx={{ bgcolor: "background.paper" }} // White background for text area
                            />
                        </Box>

                        {/* Footer */}
                        <Box
                            sx={{
                                p: 2,
                                borderTop: 1,
                                borderColor: "divider",
                                textAlign: "right",
                                bgcolor: "grey.50",
                            }}
                        >
                            <Button
                                variant="outlined"
                                onClick={() => setShowReportPreviewModal(false)}
                                sx={{ mr: 1 }}
                            >
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
            <Modal open={showSettingsModal} onClose={handleSettingsClose} aria-labelledby="settings-modal-title">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'rgba(0,0,0,0.2)' }}>
                    <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 4 }}>{renderSettingsContent()}</Box>
                </Box>
            </Modal>
            <Modal open={showAssetsModal} onClose={handleViewAssetsClose} aria-labelledby="assets-modal-title">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'rgba(0,0,0,0.2)' }}>
                    <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 4, width: { xs: '95%', sm: 700 }, maxHeight: '90vh', overflowY: 'auto', p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">All Assets</Typography>
                            <IconButton onClick={handleViewAssetsClose}><CloseIcon /></IconButton>
                        </Box>
                        <TextField
                            label="Search by Name, Serial, or Location"
                            fullWidth
                            sx={{ mb: 2 }}
                            value={assetsSearch}
                            onChange={e => setAssetsSearch(e.target.value)}
                        />
                        {assetsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                        ) : assetsError ? (
                            <Typography color="error.main">{assetsError}</Typography>
                        ) : (
                            <Box sx={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fafbfc' }}>
                                    <thead>
                                        <tr style={{ background: '#f4f6fa' }}>
                                            <th style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>Name</th>
                                            <th style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>Serial Number</th>
                                            <th style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>Category</th>
                                            <th style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>Location</th>
                                            <th style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>Service Records</th>
                                            <th style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>File</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assets.filter(a =>
                                            a.name?.toLowerCase().includes(assetsSearch.toLowerCase()) ||
                                            a.serialNumber?.toString().toLowerCase().includes(assetsSearch.toLowerCase()) ||
                                            a.location?.toLowerCase().includes(assetsSearch.toLowerCase())
                                        ).map((asset, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                                <td style={{ padding: 8 }}>{asset.name}</td>
                                                <td style={{ padding: 8 }}>{asset.serialNumber}</td>
                                                <td style={{ padding: 8 }}>{asset.category}</td>
                                                <td style={{ padding: 8 }}>{asset.location}</td>
                                                <td style={{ padding: 8 }}>{asset['service records'] || asset.serviceRecords || '-'}</td>
                                                <td style={{ padding: 8 }}>
                                                    {asset.file ? (
                                                        <a href={`${API_BASE_URL}/uploads/${asset.file}`} target="_blank" rel="noopener noreferrer">View</a>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {assets.length === 0 && <Typography sx={{ mt: 2 }}>No assets found.</Typography>}
                            </Box>
                        )}
                    </Box>
                </Box>
            </Modal>
            <Modal open={showReportsModal} onClose={handleViewReportsClose} aria-labelledby="reports-modal-title">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'rgba(0,0,0,0.2)' }}>
                    <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 4, width: { xs: '95%', sm: 700 }, maxHeight: '90vh', overflowY: 'auto', p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">All Reports</Typography>
                            <IconButton onClick={handleViewReportsClose}><CloseIcon /></IconButton>
                        </Box>
                        <TextField
                            label="Search by File Name or Date"
                            fullWidth
                            sx={{ mb: 2 }}
                            value={reportsSearch}
                            onChange={e => setReportsSearch(e.target.value)}
                        />
                        {reportsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                        ) : reportsError ? (
                            <Typography color="error.main">{reportsError}</Typography>
                        ) : (
                            <Box sx={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fafbfc' }}>
                                    <thead>
                                        <tr style={{ background: '#f4f6fa' }}>
                                            <th style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>File</th>
                                            <th style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>Uploaded</th>
                                            <th style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.filter(r =>
                                            (r.file?.toLowerCase().includes(reportsSearch.toLowerCase()) ||
                                            (r.createdAt && new Date(r.createdAt).toLocaleDateString().includes(reportsSearch)))
                                        ).map((report, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                                <td style={{ padding: 8 }}>
                                                    {report.file ? (
                                                        <a href={`${API_BASE_URL}/uploads/${report.file}`} target="_blank" rel="noopener noreferrer">View</a>
                                                    ) : '-'}
                                                </td>
                                                <td style={{ padding: 8 }}>{report.createdAt ? new Date(report.createdAt).toLocaleString() : '-'}</td>
                                                <td style={{ padding: 8 }}>
                                                    <Button size="small" variant="outlined" color="primary" sx={{ mr: 1 }} onClick={() => handleEditReport(report)}>Edit</Button>
                                                    <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteReport(report._id || report.id)}>Delete</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {reports.length === 0 && <Typography sx={{ mt: 2 }}>No reports found.</Typography>}
                            </Box>
                        )}
                    </Box>
                </Box>
            </Modal>
            <Modal open={!!editReport} onClose={() => setEditReport(null)} aria-labelledby="edit-report-modal-title">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'rgba(0,0,0,0.2)' }}>
                    <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 4, width: { xs: '95%', sm: 500 }, maxHeight: '90vh', overflowY: 'auto', p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Edit Report</Typography>
                            <IconButton onClick={() => setEditReport(null)}><CloseIcon /></IconButton>
                        </Box>
                        <TextField
                            label="Report Content"
                            fullWidth
                            multiline
                            rows={10}
                            value={editReportContent}
                            onChange={e => setEditReportContent(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <Button variant="contained" color="primary" onClick={handleEditReportSave}>Save</Button>
                    </Box>
                </Box>
            </Modal>
        </ThemeProvider>
    );
};
export default Hssm;