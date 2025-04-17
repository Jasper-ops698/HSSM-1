import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Container,
    Typography,
    Grid,
    CircularProgress,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Box,
    Snackbar, // Added
    Alert,    // Added
    Card,     // Added
    CardContent, // Added
    CardMedia,   // Added
    CardActions, // Added
    Paper,       // Added
    Stack,       // Added for layout
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile'; // Icon for upload button
import dayjs from 'dayjs';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Ensure API_BASE_URL has a fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const FALLBACK_IMAGE_URL = `${API_BASE_URL}/uploads/placeholder-image.png`;

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null); // Ref for hidden file input

    const [requests, setRequests] = useState([]);
    const [services, setServices] = useState([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);
    const [isLoadingServices, setIsLoadingServices] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [serviceDetails, setServiceDetails] = useState({
        _id: null, // Use _id to track if editing
        name: '',
        description: '',
        price: '',
        imagePath: '', // Store existing image path for editing display
    });
    const [imageFile, setImageFile] = useState(null); // For new image upload
    const [requestStatusFilter, setRequestStatusFilter] = useState('');
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });

    const getAuthToken = useCallback(() => localStorage.getItem('token'), []);

    const fetchDashboardData = useCallback(async () => {
        setIsLoadingRequests(true);
        setError(null);
        const token = getAuthToken();
        if (!token) {
            setError('Authentication required. Please log in.');
            setIsLoadingRequests(false);
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/api/dashboard/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Ensure response data is an array or default to empty
            setRequests(response.data?.requests || []);
        } catch (err) {
            console.error('Fetch Dashboard Error:', err);
            setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
            setRequests([]); // Clear requests on error
        } finally {
            setIsLoadingRequests(false);
        }
    }, [getAuthToken]);

    const fetchCreatedServices = useCallback(async () => {
        setIsLoadingServices(true);
        // Don't reset main error if only services fetch fails
        // setError(null);
        const token = getAuthToken();
        if (!token) {
            // Error already set by fetchDashboardData if token is missing
            setIsLoadingServices(false);
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/api/services/service`, { // Endpoint for provider's specific services
                headers: { Authorization: `Bearer ${token}` },
            });
            if (Array.isArray(response.data)) {
                setServices(response.data);
            } else {
                 console.warn('Received non-array response for created services:', response.data);
                 setServices([]); // Default to empty array if response is not as expected
            }
        } catch (err) {
             console.error('Fetch Created Services Error:', err);
            // Set a specific error or add to existing one if needed, but often just logging is fine
             setError(prev => prev ? `${prev}\nFailed to fetch created services.` : 'Failed to fetch created services.');
             setServices([]); // Clear services on error
        } finally {
            setIsLoadingServices(false);
        }
    }, [getAuthToken]);

    useEffect(() => {
        if (!user) {
            navigate('/login'); // Redirect if not logged in
        } else {
            fetchDashboardData();
            if (user.role === 'service-provider') {
                fetchCreatedServices();
            } else {
                 setIsLoadingServices(false); // Not a provider, no services to load
            }
        }
    }, [user, navigate, fetchDashboardData, fetchCreatedServices]);

    // --- Handlers ---

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setServiceDetails((prev) => ({ ...prev, [id]: value }));
    };

    const handleImageChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            setImageFile(event.target.files[0]);
        }
    };

    const openModalForCreate = () => {
        setServiceDetails({ _id: null, name: '', description: '', price: '', imagePath: '' }); // Reset form
        setImageFile(null); // Clear selected file
        setIsModalOpen(true);
    };

    const openModalForEdit = (service) => {
        setServiceDetails({ // Populate form with existing data
            _id: service._id,
            name: service.name || '',
            description: service.description || '',
            price: service.price || '',
            imagePath: service.imagePath || '', // Keep existing image path
        });
        setImageFile(null); // Clear selected file (user must choose a new one to replace)
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        // Optionally reset states after animation closes
        // setTimeout(() => {
        //    setServiceDetails({ _id: null, name: '', description: '', price: '', imagePath: '' });
        //    setImageFile(null);
        // }, 300);
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const { _id, name, description, price } = serviceDetails;

        if (!name || !description || !price) {
            setFeedback({ open: true, message: 'Please fill in all required fields (Name, Description, Price).', severity: 'warning' });
            return;
        }

        const token = getAuthToken();
        if (!token) {
            setFeedback({ open: true, message: 'Authentication error. Please log in again.', severity: 'error' });
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', parseFloat(price) || 0);

        if (imageFile) { // Only append if a *new* file was selected
            formData.append('image', imageFile);
        }

        const isEditing = !!_id;
        const url = isEditing ? `${API_BASE_URL}/api/services/${_id}` : `${API_BASE_URL}/api/services/`;
        const method = isEditing ? 'put' : 'post';

        try {
            await axios({ method, url, data: formData, headers: { Authorization: `Bearer ${token}` } });

            setFeedback({ open: true, message: `Service ${isEditing ? 'updated' : 'created'} successfully!`, severity: 'success' });
            closeModal();
            fetchCreatedServices(); // Refresh the list
        } catch (err) {
            console.error(`Error ${isEditing ? 'updating' : 'creating'} service:`, err);
            setFeedback({ open: true, message: err.response?.data?.message || `Error ${isEditing ? 'updating' : 'creating'} service. Please try again.`, severity: 'error' });
        }
    };

    const handleStatusChange = async (requestId, status) => {
        const token = getAuthToken();
        if (!token) {
            setFeedback({ open: true, message: 'Authentication error. Please log in again.', severity: 'error' });
            return;
        }

        // Optimistic UI update (optional but improves perceived speed)
        const originalRequests = [...requests];
        setRequests(prevRequests =>
            prevRequests.map(req =>
                req._id === requestId ? { ...req, status: status } : req
            )
        );

        try {
            await axios.put(`${API_BASE_URL}/api/requests/${requestId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFeedback({ open: true, message: 'Request status updated successfully!', severity: 'success' });
            // No need to fetch again if optimistic update is correct
            // fetchDashboardData();
        } catch (err) {
            console.error('Error updating status:', err);
            setFeedback({ open: true, message: err.response?.data?.message || 'Error updating request status.', severity: 'error' });
            // Rollback optimistic update on error
            setRequests(originalRequests);
        }
    };

    const handleCloseFeedback = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setFeedback({ ...feedback, open: false });
    };

    // --- Rendering Logic ---

    const isLoading = isLoadingRequests || isLoadingServices;

    const filteredRequests = (requests || []).filter((request) =>
        requestStatusFilter ? request.status === requestStatusFilter : true
    );

    const renderImageUrl = (imagePath) => {
        // Construct URL assuming imagePath is just the filename
        // and the server serves '/uploads' statically
        return imagePath ? `${API_BASE_URL}/uploads/${imagePath}` : FALLBACK_IMAGE_URL;
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}> {/* Increased max width and padding */}
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

            <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ fontWeight: 'medium', mb: 4 }}>
                My Dashboard
            </Typography>

            {/* Use main loading indicator only for initial combined load */}
            {isLoading && requests.length === 0 && services.length === 0 ? (
                 <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress size={60} />
                 </Box>
            ) : error ? ( // Display error prominently if initial load failed
                <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                     <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                     <Button variant="contained" onClick={() => { fetchDashboardData(); if (user?.role === 'service-provider') fetchCreatedServices(); }}>
                         Retry Loading Data
                     </Button>
                 </Paper>
            ) : (
                <Grid container spacing={4}>
                    {/* Service Requests Section */}
                    <Grid item xs={12} md={user?.role === 'service-provider' ? 6 : 12}> {/* Adjust width based on role */}
                        <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
                                Service Requests {isLoadingRequests && <CircularProgress size={20} sx={{ ml: 1 }} />}
                            </Typography>
                            <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                                <InputLabel id="status-filter-label">Filter by Status</InputLabel>
                                <Select
                                    labelId="status-filter-label"
                                    label="Filter by Status"
                                    value={requestStatusFilter}
                                    onChange={(e) => setRequestStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="">All Statuses</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="accepted">Accepted</MenuItem>
                                    <MenuItem value="completed">Completed</MenuItem>
                                    <MenuItem value="rejected">Rejected</MenuItem> {/* Added */}
                                </Select>
                            </FormControl>

                            {filteredRequests.length === 0 && !isLoadingRequests ? (
                                <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                                    No service requests found matching the filter.
                                </Typography>
                            ) : (
                                <Grid container spacing={2}>
                                    {filteredRequests.map((request) => (
                                        <Grid item xs={12} sm={6} key={request._id}>
                                            <Card variant="outlined">
                                                {/* Assuming request.service?.imagePath refers to the requested service's image */}
                                                <CardMedia
                                                    component="img"
                                                    height="140"
                                                    image={request.service?.image?.startsWith('data:image') 
                                                        ? request.service?.image 
                                                        : `${API_BASE_URL}/uploads/${request.service?.imagePath}`} // Use service image path if available
                                                    alt={`Image for ${request.service?.name || 'service'}`}
                                                    onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE_URL; }}
                                                    sx={{ objectFit: 'cover' }}
                                                />
                                                <CardContent>
                                                    <Typography variant="h6" component="div" noWrap title={request.service?.name}>
                                                        {request.service?.name || 'Unknown Service'}
                                                    </Typography>
                                                    {/* Display requester info if available */}
                                                    {request.user?.username && (
                                                         <Typography variant="body2" color="text.secondary">
                                                            Requester: {request.user.username}
                                                         </Typography>
                                                    )}
                                                    <Typography variant="body2" color="text.secondary">
                                                        Date: {dayjs(request.date).format('MMM DD, YYYY')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        Time: {request.time ? dayjs(request.time).format('h:mm A') : 'N/A'}
                                                    </Typography>
                                                    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                                                        <InputLabel>Status</InputLabel>
                                                        <Select
                                                            value={request.status || 'pending'} // Default to pending if null
                                                            onChange={(e) => handleStatusChange(request._id, e.target.value)}
                                                            label="Status"
                                                        >
                                                            <MenuItem value="pending">Pending</MenuItem>
                                                            <MenuItem value="accepted">Accepted</MenuItem>
                                                            <MenuItem value="completed">Completed</MenuItem>
                                                            <MenuItem value="rejected">Rejected</MenuItem> {/* Added */}
                                                        </Select>
                                                    </FormControl>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Paper>
                    </Grid>

                    {/* Created Services Section (Service Provider Only) */}
                    {user?.role === 'service-provider' && (
                        <Grid item xs={12} md={6}>
                            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                                     <Typography variant="h5" component="h2">
                                         My Services {isLoadingServices && <CircularProgress size={20} sx={{ ml: 1 }} />}
                                     </Typography>
                                     <Button onClick={openModalForCreate} variant="contained" size="small">
                                         Create New Service
                                     </Button>
                                </Stack>

                                {services.length === 0 && !isLoadingServices ? (
                                    <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 4 }}>
                                        You haven't created any services yet.
                                    </Typography>
                                ) : (
                                    <Grid container spacing={2}>
                                        {services.map((service) => (
                                            <Grid item xs={12} sm={6} key={service._id}>
                                                <Card variant="outlined">
                                                     {/* Display Service Image */}
                                                     <CardMedia
                                                        component="img"
                                                        height="200"
                                                        image={service.image?.startsWith('data:image') 
                                                            ? service.image 
                                                            : `${API_BASE_URL}/uploads/${service.imagePath}`} // Use helper function
                                                        alt={service.name}
                                                        sx={{ objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.currentTarget.src = FALLBACK_IMAGE_URL;
                                                        }}
                                                    />
                                                    <CardContent>
                                                        <Typography variant="h6" component="div" noWrap title={service.name}>
                                                            {service.name}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                            {service.description}
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                            Price: Ksh {service.price?.toLocaleString() || 'N/A'}
                                                        </Typography>
                                                    </CardContent>
                                                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                                                        <Button onClick={() => openModalForEdit(service)} size="small">
                                                            Edit
                                                        </Button>
                                                        {/* Add Delete Button Here if needed */}
                                                    </CardActions>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* Create/Edit Service Dialog */}
            <Dialog open={isModalOpen} onClose={closeModal} fullWidth maxWidth="sm">
                <DialogTitle>{serviceDetails._id ? 'Edit Service' : 'Create a New Service'}</DialogTitle>
                {/* Use form element to leverage browser validation if needed, but handle submit via button */}
                <DialogContent>
                     {/* Optional: Show current image when editing */}
                     {serviceDetails._id && serviceDetails.imagePath && !imageFile && (
                        <Box sx={{ mb: 2, textAlign: 'center' }}>
                             <Typography variant="caption" display="block" gutterBottom>Current Image:</Typography>
                             <img
                                src={renderImageUrl(serviceDetails.imagePath)}
                                alt="Current service"
                                style={{ maxHeight: '150px', maxWidth: '100%', borderRadius: '4px' }}
                                onError={(e) => { e.target.style.display='none'; }} // Hide if broken
                            />
                        </Box>
                     )}

                    <TextField
                        autoFocus // Focus on first field
                        margin="dense"
                        id="name"
                        label="Service Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={serviceDetails.name}
                        onChange={handleInputChange}
                        required
                        size="small"
                         sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        id="description"
                        label="Description"
                        type="text"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={3}
                        value={serviceDetails.description}
                        onChange={handleInputChange}
                        required
                        size="small"
                         sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        id="price"
                        label="Price (Ksh)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={serviceDetails.price}
                        onChange={handleInputChange}
                        required
                        size="small"
                        InputProps={{ inputProps: { min: 0, step: "any" } }} // Allow decimals, prevent negative
                         sx={{ mb: 2 }}
                    />
                    {/* Styled File Input */}
                    <Box sx={{ mt: 1, mb: 2 }}>
                        <Button
                            variant="outlined"
                            component="label" // Makes the button act as a label for the hidden input
                            startIcon={<UploadFileIcon />}
                            size="small"
                        >
                            {imageFile ? 'Change Image' : 'Upload Image'}
                            <input
                                type="file"
                                hidden // Hide the default input
                                accept="image/*" // Specify acceptable file types
                                onChange={handleImageChange}
                                ref={fileInputRef} // Optional ref if needed
                            />
                        </Button>
                        {/* Display selected filename */}
                        {imageFile && (
                             <Typography variant="caption" sx={{ ml: 2 }}>
                                 Selected: {imageFile.name}
                             </Typography>
                        )}
                         {!imageFile && serviceDetails._id && serviceDetails.imagePath && (
                             <Typography variant="caption" sx={{ ml: 2, fontStyle: 'italic' }}>
                                 Current image will be kept unless a new one is uploaded.
                             </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeModal} color="secondary">Cancel</Button>
                    <Button onClick={handleFormSubmit} variant="contained" color="primary">
                        {serviceDetails._id ? 'Update Service' : 'Create Service'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Dashboard;