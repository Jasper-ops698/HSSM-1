import React from 'react';
import { Card, CardMedia, CardContent, Typography, Box } from '@mui/material';

const ServiceCard = ({ service }) => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  
  return (
    <Card 
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)'
        }
      }}
    >
      <CardMedia
        component="img"
        className="service-image"
        image={service.image ? `${API_BASE_URL}/${service.image}` : `${API_BASE_URL}/uploads/placeholder-image.png`}
        alt={service.name}
        sx={{
          height: 200,
          objectFit: 'contain',
          bgcolor: 'background.paper'
        }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="h2" noWrap>
          {service.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          mb: 2
        }}>
          {service.description}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Typography variant="h6" color="primary">
            ${service.price}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            By {service.provider?.name || 'Unknown Provider'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;