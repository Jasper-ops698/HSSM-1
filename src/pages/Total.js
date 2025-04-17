import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Grid,
    Stack,
    CircularProgress,
    Typography,
    TextField,
    Card,          // Use Card for better structure and elevation
    CardContent,   // For text content within the card
    CardMedia,     // Optimized for displaying media like images
    Container,     // Provides basic layout constraints
    Box,           // General purpose layout component
    Button,        // Use MUI Button
    InputAdornment,// To add 'Ksh' prefix to price
    Alert          // For displaying errors
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Icon for back button

// Ensure API_BASE_URL has a fallback for local development if .env is not set
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000'; // Example fallback
const FALLBACK_IMAGE_URL = `${API_BASE_URL}/uploads/placeholder-image.png`;

const Total = () => {
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(''); // State for handling fetch errors
    const [priceFilter, setPriceFilter] = useState('');
    const [nameFilter, setNameFilter] = useState('');


    const fetchServices = async () => {
        setIsLoading(true);
        setError(''); // Clear previous errors
        try {
            const token = localStorage.getItem('token');
            // Basic check if token exists, could add more validation
            if (!token) {
                setError('Authentication token not found. Please log in.');
                setIsLoading(false);
                return;
            }
            if (!API_BASE_URL) {
                setError('API configuration error. Base URL is missing.');
                console.error('API_BASE_URL is not defined');
                setIsLoading(false);
                return;
            }
            const response = await axios.get(`${API_BASE_URL}/api/services/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setServices(response.data || []); // Ensure it's an array
            setFilteredServices(response.data || []);
        } catch (err) {
            console.error('Error fetching services:', err.response ? err.response.data : err.message);
            setError(`Failed to fetch services: ${err.response?.data?.message || err.message}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        fetchServices();
    }, []); // Fetch only on initial mount

    useEffect(() => {
        // Apply filters whenever filters or the base services list change
        let filtered = services;

        // Filter by maximum price (only if priceFilter is a valid number)
        const maxPrice = parseFloat(priceFilter);
        if (!isNaN(maxPrice) && maxPrice >= 0) {
            filtered = filtered.filter(service => service.price <= maxPrice);
        }

        // Filter by name (case-insensitive)
        if (nameFilter.trim()) { // Check if nameFilter has non-whitespace content
            filtered = filtered.filter(service =>
                service.name.toLowerCase().includes(nameFilter.trim().toLowerCase())
            );
        }

        setFilteredServices(filtered);
    }, [priceFilter, nameFilter, services]);

    // Handler for name filter with debounce (optional)
    const handleNameFilterChange = (event) => {
        setNameFilter(event.target.value);
    };
    // Example of debounced handler if needed for performance:
    // const debouncedNameFilter = useCallback(debounce(setNameFilter, 300), []);
    // onChange={(e) => debouncedNameFilter(e.target.value)} instead of direct setNameFilter


    return (
        <Container maxWidth="lg" sx={{ py: 3 }}> {/* Add padding */}
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => window.history.back()}
                variant="outlined"
                sx={{ mb: 3 }} // Add margin bottom
            >
                Go Back
            </Button>

            <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                Available Services
            </Typography>

            {/* Filters Section */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 2, // Spacing between filter fields
                    mb: 4,  // Margin below filters
                    flexWrap: 'wrap' // Allow filters to wrap on smaller screens
                }}
            >
                <TextField
                    label="Max Price"
                    type="number"
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    variant="outlined"
                    size="small"
                    InputProps={{
                        startAdornment: <InputAdornment position="start">Ksh</InputAdornment>,
                        inputProps: { min: 0 } // Prevent negative numbers
                    }}
                    sx={{ minWidth: '150px' }} // Ensure minimum width
                />
                <TextField
                    label="Filter by Service Name"
                    value={nameFilter}
                    onChange={handleNameFilterChange} // Use handler (debounced if needed)
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: '250px' }} // Ensure minimum width
                />
            </Box>

            {/* Loading State */}
            {isLoading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: '40vh' }}>
                    <CircularProgress size={60} />
                    <Typography sx={{ mt: 2 }}>Loading Services...</Typography>
                </Stack>
            ) : error ? ( // Error State
                 <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
                    <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: '600px' }}>
                        {error}
                    </Alert>
                    <Button variant="contained" onClick={fetchServices}>
                        Retry
                    </Button>
                </Box>
            ) : ( // Content Display
                <>
                    {/* Service Grid */}
                    {Array.isArray(filteredServices) && filteredServices.length > 0 ? (
                        <Grid container spacing={3}>
                            {filteredServices.map((service) => (
                                <Grid item xs={12} sm={6} md={4} key={service._id}>
                                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}> {/* Ensure cards fill height and layout content */}
                                        {/* Conditionally render CardMedia */}
                                        {service.image && (
                                            <CardMedia
                                                component="img"
                                                height="200"
                                                // Handle both base64 and URL images
                                                image={service.image.startsWith('data:image') 
                                                    ? service.image 
                                                    : `${API_BASE_URL}/uploads/${service.image}`}
                                                alt={service.name}
                                                sx={{ objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.currentTarget.src = FALLBACK_IMAGE_URL;
                                                }}
                                            />
                                        )}
                                        {/* Fallback placeholder */}
                                        {!service.image && (
                                            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
                                                <Typography color="text.secondary">No Image</Typography>
                                            </Box>
                                        )}
                                        <CardContent sx={{ flexGrow: 1 }}> {/* Allow content to take remaining space */}
                                            <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 'medium' }}>
                                                {service.name || 'Unnamed Service'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {service.description || 'No description available.'}
                                            </Typography>
                                            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                                Ksh {service.price != null ? service.price.toLocaleString() : 'N/A'} {/* Format price */}
                                            </Typography>
                                        </CardContent>
                                        {/* Add CardActions here if you need buttons like "Book Now" or "Details" */}
                                        {/* <CardActions> <Button size="small">Learn More</Button> </CardActions> */}
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        // No Results Message
                        <Typography sx={{ textAlign: 'center', mt: 4, fontStyle: 'italic' }}>
                            No services match the current filters.
                        </Typography>
                    )}
                </>
            )}
        </Container>
    );
};

export default Total;