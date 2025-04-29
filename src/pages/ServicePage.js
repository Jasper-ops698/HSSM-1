import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Button,
    TextField,
    MenuItem,
    CircularProgress,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Typography,
    Container,    // Added
    Box,          // Added
    Snackbar,     // Added
    Alert,        // Added
    Card,         // Added
    CardContent,  // Added
    CardMedia,    // Added
    Paper,        // Added
    FormControl,  // Added
    InputLabel,   // Added
    Select,       // Added
    List,         // Added for attachments
    ListItem,     // Added for attachments
    ListItemText, // Added for attachments
    IconButton,   // Added for attachments
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import UploadFileIcon from '@mui/icons-material/UploadFile'; // Added
import DeleteIcon from '@mui/icons-material/Delete';       // Added
import dayjs from 'dayjs'; // Ensure dayjs is imported if used directly
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Assuming useAuth provides user profile

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const FALLBACK_IMAGE_URL = `${API_BASE_URL}/uploads/placeholder-image.png`;

const ServiceRequestForm = () => {
    const { user } = useAuth(); // Get user info from context
    const fileInputRef = useRef(null);
 
    // --- State ---
    const [formData, setFormData] = useState({
        serviceId: '', // Store ID, not name
        date: null,
        time: null,
        description: '',
        location: '',
        // Removed review/rating fields
    });
    const [attachments, setAttachments] = useState([]); // State for file objects
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [isLoadingServices, setIsLoadingServices] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // Separate submitting state
    const [isModalOpen, setModalOpen] = useState(false);
    const [error, setError] = useState(null); // General error (e.g., fetching)
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });
    // Filters
    const [priceFilter, setPriceFilter] = useState('');
    const [nameFilter, setNameFilter] = useState('');

    // --- Data Fetching ---
    const fetchServices = useCallback(async () => {
        setIsLoadingServices(true);
        setError(null);
        try {
            const token = localStorage.getItem('token'); // Still need token for API access
             if (!token) {
                setError('Authentication required.'); // Set error if no token
                setIsLoadingServices(false);
                return;
             }
            const response = await axios.get(`${API_BASE_URL}/api/services/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = response.data || [];
            if (Array.isArray(data)) {
                setServices(data);
                setFilteredServices(data); // Initially show all
            } else {
                 console.warn("Fetched services data is not an array:", data);
                setServices([]);
                setFilteredServices([]);
            }
        } catch (err) {
            console.error('Error fetching services:', err.response ? err.response.data : err.message);
            setError(`Failed to fetch services: ${err.response?.data?.message || err.message}`);
            setServices([]);
            setFilteredServices([]);
        } finally {
            setIsLoadingServices(false);
        }
    }, []);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    // --- Filtering Logic ---
    useEffect(() => {
        let filtered = services;

        const maxPrice = parseFloat(priceFilter);
        if (!isNaN(maxPrice) && maxPrice >= 0) {
            filtered = filtered.filter(service => service.price <= maxPrice);
        }

        if (nameFilter.trim()) {
            filtered = filtered.filter(service =>
                service.name.toLowerCase().includes(nameFilter.trim().toLowerCase())
            );
        }
        setFilteredServices(filtered);
    }, [priceFilter, nameFilter, services]);

    // --- Handlers ---
    const handleModalOpen = (serviceId = '') => {
        console.log('Opening modal...');  // Add logging
        setFormData({
            serviceId: serviceId,
            date: null,
            time: null,
            description: '',
            location: '',
        });
        setAttachments([]); // Clear attachments when opening modal
        setError(null); // Clear previous form errors
        setModalOpen(true);
        console.log('Modal state set to:', true);  // Add logging
    };

    const handleModalClose = () => {
        console.log('Closing modal...');  // Add logging
        setModalOpen(false);
        // Consider resetting form state after close animation if needed
    };

    const handleFormInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, date }));
    };

    const handleTimeChange = (time) => {
        setFormData(prev => ({ ...prev, time }));
    };

    const handleAttachmentChange = (event) => {
        if (event.target.files) {
            // Append new files to existing ones, prevent duplicates maybe? For simplicity, just add.
             setAttachments(prev => [...prev, ...Array.from(event.target.files)]);
        }
    };

     const handleRemoveAttachment = (fileNameToRemove) => {
        setAttachments(prev => prev.filter(file => file.name !== fileNameToRemove));
     };

    const handleSubmit = async (event) => {
        event.preventDefault();
        // Validation
        if (!formData.serviceId || !formData.date || !formData.time || !formData.description || !formData.location) {
            setFeedback({ open: true, message: 'Please fill in all required fields (Service, Date, Time, Location, Description).', severity: 'warning' });
            return;
        }
        if (!user) {
            setFeedback({ open: true, message: 'User information not found. Please log in again.', severity: 'error' });
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setFeedback({ open: true, message: 'Authentication token missing. Please log in.', severity: 'error' });
            return;
        }

        setIsSubmitting(true);
        setFeedback({ open: false, message: '', severity: 'info' }); // Clear previous feedback

        const requestData = new FormData();
        requestData.append('service', formData.serviceId); // Send service ID
        requestData.append('date', dayjs(formData.date).toISOString()); // Send ISO string date
        requestData.append('time', dayjs(formData.time).toISOString()); // Send ISO string time (or format as needed by backend)
        requestData.append('description', formData.description);
        requestData.append('location', formData.location);
        // User info from context
        requestData.append('userName', user.name || user.username || 'N/A'); // Adjust based on your user object structure
        requestData.append('userEmail', user.email || 'N/A');
        requestData.append('userPhone', user.phone || 'N/A'); // Assuming phone is available

        attachments.forEach((file) => {
            requestData.append('attachments', file); // Use same field name for multiple files
        });

        try {
            await axios.post(`${API_BASE_URL}/api/requests/`, requestData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    // Content-Type is set automatically by browser for FormData
                },
            });

            setFeedback({ open: true, message: 'Service request submitted successfully!', severity: 'success' });
            handleModalClose(); // Close modal on success
            // Optionally clear form fields here if not done by handleModalOpen/Close logic
        } catch (err) {
            console.error('Error submitting request:', err.response ? err.response.data : err.message);
            setFeedback({ open: true, message: `Submission failed: ${err.response?.data?.message || err.message}`, severity: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseFeedback = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setFeedback({ ...feedback, open: false });
    };

    const renderImageUrl = (imagePath) => {
        if (!imagePath) return FALLBACK_IMAGE_URL;
        if (imagePath.startsWith('data:image')) return imagePath;
        const cleanPath = imagePath.startsWith('uploads/') ? imagePath.slice(8) : imagePath;
        return `${API_BASE_URL}/uploads/${cleanPath}`;
    };

    // --- Render ---
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Snackbar
                open={feedback.open}
                autoHideDuration={6000}
                onClose={handleCloseFeedback}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseFeedback} severity={feedback.severity} sx={{ width: '100%' }} variant="filled">
                    {feedback.message}
                </Alert>
            </Snackbar>

            <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ mb: 4 }}>
                Browse & Request Services
            </Typography>

             {/* Filters */}
             <Paper elevation={1} sx={{ p: 2, mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                <TextField
                    label="Filter by Max Price (Ksh)"
                    type="number"
                    size="small"
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{ minWidth: '200px' }}
                />
                <TextField
                    label="Filter by Name"
                    size="small"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    sx={{ minWidth: '250px' }}
                />
             </Paper>

            {/* Request Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                 <Button variant="contained" color="primary" onClick={() => handleModalOpen()} size="large">
                    Request a Service
                 </Button>
            </Box>

            {/* Service Grid */}
            {isLoadingServices ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress size={50} /></Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            ) : filteredServices.length === 0 ? (
                <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
                    No services found matching your criteria.
                </Typography>
            ) : (
                <Grid container spacing={3}>
                    {filteredServices.map((service) => (
                        <Grid item xs={12} sm={6} md={4} key={service._id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardMedia
                                    component="img"
                                    height="180"
                                    image={renderImageUrl(service.image)}
                                    alt={service.name}
                                    loading="lazy"
                                    sx={{ 
                                        objectFit: 'cover',
                                        backgroundColor: 'background.paper'
                                    }}
                                    onError={(e) => {
                                        e.target.onerror = null; // Prevent infinite error loop
                                        e.target.src = FALLBACK_IMAGE_URL;
                                    }}
                                />
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography gutterBottom variant="h6" component="div" noWrap title={service.name}>
                                        {service.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {service.description}
                                    </Typography>
                                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                        Ksh {service.price?.toLocaleString() || 'N/A'}
                                    </Typography>
                                </CardContent>
                                {/* Removed review button */}
                                {/* Optional: Add button to directly request *this* service */}
                                {/* <CardActions>
                                    <Button size="small" onClick={() => handleModalOpen(service._id)}>Request This Service</Button>
                                </CardActions> */}
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Service Request Modal */}
            <Dialog 
                open={isModalOpen} 
                onClose={handleModalClose} 
                fullWidth 
                maxWidth="sm"
                keepMounted
                aria-labelledby="service-request-dialog"
                disableEscapeKeyDown
            >
                <DialogTitle id="service-request-dialog">Request a Service</DialogTitle>
                <DialogContent>
                    {/* Show Loading/Error specific to service list within modal if needed */}
                    {/* {isLoadingServices && <CircularProgress />} */}

                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                         {/* Display User Info Subtly */}
                         <Typography variant="caption" display="block" sx={{ mb: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                            Requesting as: {user?.name || user?.username} ({user?.email})
                         </Typography>

                        <FormControl fullWidth required margin="normal" size="small">
                            <InputLabel id="service-select-label">Service Type *</InputLabel>
                            <Select
                                labelId="service-select-label"
                                id="serviceId"
                                name="serviceId" // Name matches state key
                                value={formData.serviceId}
                                label="Service Type *"
                                onChange={handleFormInputChange}
                            >
                                <MenuItem value="" disabled><em>Select a service...</em></MenuItem>
                                {services.map((service) => (
                                    <MenuItem key={service._id} value={service._id}> {/* Use ID as value */}
                                        {service.name} (Ksh {service.price?.toLocaleString()})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ mt: 2, mb: 1 }}>
                                <DesktopDatePicker
                                    label="Date *"
                                    inputFormat="DD/MM/YYYY"
                                    value={formData.date}
                                    onChange={handleDateChange}
                                    renderInput={(params) => <TextField {...params} fullWidth required size="small" />}
                                    minDate={dayjs()} // Prevent selecting past dates
                                />
                                <TimePicker
                                    label="Time *"
                                    value={formData.time}
                                    onChange={handleTimeChange}
                                    renderInput={(params) => <TextField {...params} fullWidth required size="small" />}
                                />
                            </Stack>
                        </LocalizationProvider>

                        <TextField
                            label="Location *"
                            id="location"
                            name="location" // Name matches state key
                            value={formData.location}
                            onChange={handleFormInputChange}
                            fullWidth
                            required
                            margin="normal"
                            size="small"
                        />

                        <TextField
                            label="Description / Specific Instructions *"
                            id="description"
                            name="description" // Name matches state key
                            value={formData.description}
                            onChange={handleFormInputChange}
                            fullWidth
                            required
                            margin="normal"
                            multiline
                            rows={4}
                            size="small"
                        />

                        {/* File Attachments Input */}
                         <Box sx={{ mt: 2, mb: 1, border: '1px dashed grey', p: 2, borderRadius: 1 }}>
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<UploadFileIcon />}
                                size="small"
                                sx={{ mb: attachments.length > 0 ? 1 : 0 }}
                            >
                                Add Attachments (Optional)
                                <input
                                    type="file"
                                    hidden
                                    multiple
                                    onChange={handleAttachmentChange}
                                    ref={fileInputRef}
                                    accept="image/*,application/pdf,.doc,.docx" // Specify accepted types
                                />
                            </Button>
                             {/* List selected files */}
                            {attachments.length > 0 && (
                                <List dense disablePadding>
                                    {attachments.map((file, index) => (
                                        <ListItem
                                            key={index}
                                            disableGutters
                                            secondaryAction={
                                                <IconButton edge="end" aria-label="delete" size="small" onClick={() => handleRemoveAttachment(file.name)}>
                                                    <DeleteIcon fontSize="small"/>
                                                </IconButton>
                                            }
                                        >
                                            <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>

                        {/* Submit Button inside Form */}
                        <DialogActions sx={{ px: 0, pt: 2 }}>
                            <Button onClick={handleModalClose} color="secondary" disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={isSubmitting}
                                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit"/> : null}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </DialogActions>
                    </Box> {/* End Form */}
                </DialogContent>
                {/* Removed separate DialogActions as submit is inside the form */}
            </Dialog>
        </Container>
    );
};

export default ServiceRequestForm;