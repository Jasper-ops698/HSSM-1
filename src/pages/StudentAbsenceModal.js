import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, Snackbar, Alert
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const LOGO_COLOR = '#1976d2';

const StudentAbsenceModal = ({ open, onClose, classId, userId, refreshAbsences }) => {
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEvidence(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!reason || !date || !duration) {
      setFeedback({ open: true, message: 'Please fill all required fields.', severity: 'warning' });
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('user', userId);
      formData.append('role', 'student');
      formData.append('class', classId);
      formData.append('reason', reason);
      formData.append('date', date);
      formData.append('duration', duration);
      if (evidence) formData.append('evidence', evidence);
      await axios.post(`${API_BASE_URL}/api/absences`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedback({ open: true, message: 'Absence application submitted!', severity: 'success' });
      setReason(''); setDate(''); setDuration(''); setEvidence(null);
      if (refreshAbsences) refreshAbsences();
      onClose();
    } catch (err) {
      setFeedback({ open: true, message: 'Failed to submit absence.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ color: LOGO_COLOR }}>Student Absence Application</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Please fill in the details below to apply for absence. Evidence attachment is optional.
        </Typography>
        <TextField
          label="Reason for Absence"
          fullWidth
          required
          value={reason}
          onChange={e => setReason(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Date of Absence"
          type="date"
          fullWidth
          required
          value={date}
          onChange={e => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Duration (days)"
          type="number"
          fullWidth
          required
          value={duration}
          onChange={e => setDuration(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" component="label" sx={{ bgcolor: '#e3f2fd', color: LOGO_COLOR }}>
            {evidence ? 'Change Evidence' : 'Add Evidence (Optional)'}
            <input type="file" hidden onChange={handleFileChange} accept="image/*,application/pdf,.doc,.docx" />
          </Button>
          {evidence && (
            <Typography variant="caption" sx={{ ml: 2 }}>
              Selected: {evidence.name}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ bgcolor: LOGO_COLOR }} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </DialogActions>
      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback({ ...feedback, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setFeedback({ ...feedback, open: false })} severity={feedback.severity} variant="filled">
          {feedback.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default StudentAbsenceModal;
