import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Add, Delete, Edit, Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Centralized API utility
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AnnouncementManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetClass: '',
    targetAudience: 'all', // 'all', 'class', 'specific'
    specific: [],
    isActive: true
  });
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/announcements/teacher');
      setAnnouncements(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        (async () => {
          const response = await api.get('/api/announcements/teacher');
          setAnnouncements(response.data);
        })(),
        (async () => {
          const response = await api.get('/api/teacher/classes');
          setAvailableClasses(response.data);
        })(),
        (async () => {
          const response = await api.get('/api/teacher/students');
          setAvailableStudents(response.data);
        })(),
      ]);
      setError('');
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load required data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);


  const handleCreateOpen = () => {
    setFormData({
      title: '',
      content: '',
      targetClass: '',
      targetAudience: 'all',
      specific: [],
      isActive: true
    });
    setOpenCreateDialog(true);
  };

  const handleEditOpen = (announcement) => {
    setCurrentAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      targetClass: announcement.targetClass || '',
      targetAudience: announcement.targetAudience || 'all',
      specific: announcement.specific || [],
      isActive: announcement.isActive
    });
    setOpenEditDialog(true);
  };

  const handleClose = () => {
    setOpenCreateDialog(false);
    setOpenEditDialog(false);
    setCurrentAnnouncement(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSaveAnnouncement = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      if (currentAnnouncement) {
        // Update
        await api.put(`/api/announcements/${currentAnnouncement._id}`, formData);
      } else {
        // Create
        await api.post('/api/announcements', formData);
      }
      handleClose();
      fetchAnnouncements();
    } catch (err) {
      console.error(`Error ${currentAnnouncement ? 'updating' : 'creating'} announcement:`, err);
      setError(`Failed to ${currentAnnouncement ? 'update' : 'create'} announcement. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      setIsSubmitting(true);
      setError('');
      try {
        await api.delete(`/api/announcements/${id}`);
        fetchAnnouncements();
      } catch (err) {
        console.error('Error deleting announcement:', err);
        setError('Failed to delete announcement. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    setError('');
    try {
      await api.patch(`/api/announcements/${id}/status`, { isActive: !currentStatus });
      fetchAnnouncements();
    } catch (err) {
      console.error('Error toggling announcement status:', err);
      setError('Failed to update announcement status. Please try again.');
    }
  };

  const AnnouncementDialog = ({ open, onClose, onSave, isEdit }) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Announcement' : 'Create New Announcement'}</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          name="title"
          label="Announcement Title"
          fullWidth
          variant="outlined"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
        <TextField
          margin="dense"
          name="content"
          label="Announcement Content"
          fullWidth
          variant="outlined"
          multiline
          rows={4}
          value={formData.content}
          onChange={handleInputChange}
          required
        />
        
        <FormControl fullWidth margin="dense">
          <InputLabel>Target Audience</InputLabel>
          <Select
            name="targetAudience"
            value={formData.targetAudience}
            onChange={handleInputChange}
            label="Target Audience"
          >
            <MenuItem value="all">All Students</MenuItem>
            <MenuItem value="class">Specific Class</MenuItem>
            <MenuItem value="specific">Specific Students</MenuItem>
          </Select>
        </FormControl>
        
        {formData.targetAudience === 'class' && (
          <FormControl fullWidth margin="dense">
            <InputLabel>Select Class</InputLabel>
            <Select
              name="targetClass"
              value={formData.targetClass}
              onChange={handleInputChange}
              label="Select Class"
            >
              {availableClasses.map(cls => (
                <MenuItem key={cls._id} value={cls._id}>
                  {cls.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {formData.targetAudience === 'specific' && (
          <FormControl fullWidth margin="dense">
            <InputLabel>Select Students</InputLabel>
            <Select
              name="specific"
              multiple
              value={formData.specific}
              onChange={handleInputChange}
              label="Select Students"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const student = availableStudents.find(s => s._id === value);
                    return (
                      <Chip key={value} label={student ? student.name : value} />
                    );
                  })}
                </Box>
              )}
            >
              {availableStudents.map(student => (
                <MenuItem key={student._id} value={student._id}>
                  {student.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControlLabel
          control={
            <Switch
              name="isActive"
              checked={formData.isActive}
              onChange={handleSwitchChange}
              color="primary"
            />
          }
          label="Make announcement active"
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button onClick={onSave} variant="contained" color="primary" disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={24} /> : (isEdit ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Manage Announcements</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          onClick={handleCreateOpen}
        >
          Create Announcement
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {announcements.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6">No announcements yet</Typography>
              <Typography variant="body2" color="textSecondary">
                Create your first announcement to inform students about important updates.
              </Typography>
            </Paper>
          </Grid>
        ) : (
          announcements.map(announcement => {
            let audienceLabel = 'All Students';
            if (announcement.targetAudience === 'class') {
              const className = availableClasses.find(c => c._id === announcement.targetClass)?.name;
              audienceLabel = `Class: ${className || 'N/A'}`;
            } else if (announcement.targetAudience === 'specific') {
              audienceLabel = `${announcement.specific.length} Student(s)`;
            }

            return (
            <Grid item xs={12} sm={6} md={4} key={announcement._id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                opacity: announcement.isActive ? 1 : 0.7
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Typography variant="h6" gutterBottom>
                      {announcement.title}
                    </Typography>
                    <Box>
                      <IconButton 
                        size="small" 
                        color={announcement.isActive ? "success" : "default"}
                        onClick={() => handleToggleActive(announcement._id, announcement.isActive)}
                        title={announcement.isActive ? "Active (click to deactivate)" : "Inactive (click to activate)"}
                      >
                        {announcement.isActive ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleEditOpen(announcement)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteAnnouncement(announcement._id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Created: {new Date(announcement.createdAt).toLocaleDateString()}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {announcement.content.length > 100 
                      ? `${announcement.content.substring(0, 100)}...` 
                      : announcement.content}
                  </Typography>
                  
                  <Box sx={{ mt: 'auto' }}>
                    <Chip 
                      label={announcement.isActive ? "Active" : "Inactive"} 
                      color={announcement.isActive ? "success" : "default"}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    
                    <Chip
                      label={audienceLabel}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )})
        )}
      </Grid>

      <AnnouncementDialog
        open={openCreateDialog || openEditDialog}
        onClose={handleClose}
        onSave={handleSaveAnnouncement}
        isEdit={!!currentAnnouncement}
      />
    </Box>
  );
};

export default AnnouncementManager;
