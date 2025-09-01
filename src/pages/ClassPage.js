import React, { useState, useEffect, useCallback } from 'react';
import {
    Button,
    TextField,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Typography,
    Container,
    Box,
    Snackbar,
    Alert,
    Card,
    CardContent,
    CardMedia,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const FALLBACK_IMAGE_URL = `${API_BASE_URL}/uploads/placeholder-image.png`;

const ClassEnrollmentPage = () => {
    const { user } = useAuth();

    // --- State ---
    const [formData, setFormData] = useState({
        classId: '',
        message: '',
    });
    const [classes, setClasses] = useState([]);
    const [filteredClasses, setFilteredClasses] = useState([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });
    
    // Filters
    const [creditsFilter, setCreditsFilter] = useState('');
    const [nameFilter, setNameFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [departments, setDepartments] = useState([]);

    // --- Data Fetching ---
    const fetchClasses = useCallback(async () => {
        setIsLoadingClasses(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required.');
                setIsLoadingClasses(false);
                return;
            }
            const response = await axios.get(`${API_BASE_URL}/api/classes/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = response.data || [];
            if (Array.isArray(data)) {
                setClasses(data);
                setFilteredClasses(data);
                // Extract unique departments for the filter dropdown
                const uniqueDepartments = [...new Set(data.map(c => c.department).filter(Boolean))];
                setDepartments(uniqueDepartments);
            } else {
                console.warn("Fetched classes data is not an array:", data);
                setClasses([]);
                setFilteredClasses([]);
            }
        } catch (err) {
            console.error('Error fetching classes:', err.response ? err.response.data : err.message);
            setError(`Failed to fetch classes: ${err.response?.data?.message || err.message}`);
            setClasses([]);
            setFilteredClasses([]);
        } finally {
            setIsLoadingClasses(false);
        }
    }, []);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    // --- Filtering Logic ---
    useEffect(() => {
        let filtered = classes;

        const maxCredits = parseFloat(creditsFilter);
        if (!isNaN(maxCredits) && maxCredits >= 0) {
            filtered = filtered.filter(cls => cls.creditsRequired <= maxCredits);
        }

        if (nameFilter.trim()) {
            filtered = filtered.filter(cls =>
                cls.name.toLowerCase().includes(nameFilter.trim().toLowerCase())
            );
        }

        if (departmentFilter) {
            filtered = filtered.filter(cls => cls.department === departmentFilter);
        }

        setFilteredClasses(filtered);
    }, [creditsFilter, nameFilter, departmentFilter, classes]);

    // --- Handlers ---
    const handleModalOpen = (classId = '') => {
        setFormData({
            classId: classId,
            message: '',
        });
        setError(null);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
    };

    const handleFormInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!formData.classId) {
            setError('A class must be selected.');
            return;
        }
        setIsSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const payload = {
                classId: formData.classId,
                message: formData.message,
            };

            await axios.post(`${API_BASE_URL}/api/enrollments/request`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setFeedback({ open: true, message: 'Enrollment request sent successfully!', severity: 'success' });
            handleModalClose();
            // Optionally, refresh data or update UI state
        } catch (err) {
            console.error('Error sending enrollment request:', err.response ? err.response.data : err.message);
            setError(`Request failed: ${err.response?.data?.message || 'Please try again.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageError = (e) => {
        if (e.target.src !== FALLBACK_IMAGE_URL) {
            e.target.src = FALLBACK_IMAGE_URL;
        }
    };

    // --- Render ---
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Available Classes
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Browse and enroll in classes. Your current credit balance is {user?.credits ?? 'N/A'}.
                </Typography>

                {/* Filter Controls */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Filter by Class Name"
                            variant="outlined"
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>Filter by Department</InputLabel>
                            <Select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                label="Filter by Department"
                            >
                                <MenuItem value=""><em>All Departments</em></MenuItem>
                                {departments.map(dep => <MenuItem key={dep} value={dep}>{dep}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Max Credits Required"
                            type="number"
                            variant="outlined"
                            value={creditsFilter}
                            onChange={(e) => setCreditsFilter(e.target.value)}
                            inputProps={{ min: 0 }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Class Listing */}
            {isLoadingClasses ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            ) : error && !classes.length ? (
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            ) : (
                <Grid container spacing={4}>
                    {filteredClasses.length > 0 ? (
                        filteredClasses.map((cls) => (
                            <Grid item key={cls._id} xs={12} sm={6} md={4}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardMedia
                                        component="img"
                                        height="160"
                                        image={cls.image ? `${API_BASE_URL}/${cls.image.replace(/\\/g, '/')}` : FALLBACK_IMAGE_URL}
                                        alt={cls.name}
                                        onError={handleImageError}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography gutterBottom variant="h5" component="h2">
                                            {cls.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {cls.description}
                                        </Typography>
                                        <Typography variant="subtitle1" sx={{ mt: 1 }}>
                                            Department: {cls.department || 'N/A'}
                                        </Typography>
                                        <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>
                                            Credits: {cls.creditsRequired}
                                        </Typography>
                                        
                                        {/* Venue Announcements */}
                                        {cls.venueAnnouncements && cls.venueAnnouncements.length > 0 && 
                                          cls.venueAnnouncements
                                            .filter(announcement => announcement.active)
                                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                                            .slice(0, 1)
                                            .map((announcement, index) => (
                                              <Box key={index} sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(66, 165, 245, 0.1)', borderRadius: 1 }}>
                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                                                  <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                  <strong>Venue:</strong> {announcement.venue}
                                                </Typography>
                                                {announcement.message && (
                                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    {announcement.message}
                                                  </Typography>
                                                )}
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                  Updated: {new Date(announcement.date).toLocaleDateString()}
                                                </Typography>
                                              </Box>
                                            ))
                                        }
                                    </CardContent>
                                    <Box sx={{ p: 2, pt: 0 }}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleModalOpen(cls._id)}
                                            disabled={user?.role !== 'student'}
                                        >
                                            Request Enrollment
                                        </Button>
                                    </Box>
                                </Card>
                            </Grid>
                        ))
                    ) : (
                        <Grid item xs={12}>
                            <Typography variant="h6" align="center" color="text.secondary" sx={{ mt: 5 }}>
                                No classes found matching your criteria.
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* Enrollment Request Modal */}
            <Dialog open={isModalOpen} onClose={handleModalClose} fullWidth maxWidth="sm">
                <DialogTitle>Request Enrollment</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            You are requesting to enroll in a class. You can add an optional message to the teacher.
                        </Typography>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="message"
                            name="message"
                            label="Message to Teacher (Optional)"
                            type="text"
                            fullWidth
                            multiline
                            rows={4}
                            variant="outlined"
                            value={formData.message}
                            onChange={handleFormInputChange}
                        />
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    </DialogContent>
                    <DialogActions sx={{ p: '16px 24px' }}>
                        <Button onClick={handleModalClose} color="secondary">Cancel</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <CircularProgress size={24} /> : 'Send Request'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Feedback Snackbar */}
            <Snackbar
                open={feedback.open}
                autoHideDuration={6000}
                onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setFeedback(prev => ({ ...prev, open: false }))} severity={feedback.severity} sx={{ width: '100%' }}>
                    {feedback.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ClassEnrollmentPage;