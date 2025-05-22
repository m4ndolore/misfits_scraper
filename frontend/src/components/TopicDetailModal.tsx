import React from 'react';
import { Topic } from '../types';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import CloseIcon from '@mui/icons-material/Close';

interface TopicDetailModalProps {
  open: boolean;
  onClose: () => void;
  topic: Topic | null;
}

const TopicDetailModal: React.FC<TopicDetailModalProps> = ({ open, onClose, topic }) => {
  if (!topic) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: 'linear-gradient(145deg, #f5f5f5, #e0e0e0)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          position: 'relative',
          overflow: 'hidden',
          maxWidth: '800px',
          margin: '16px',
        }
      }}
    >
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        right: 0,
        padding: 1
      }}>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ 
        padding: 3,
        background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
        color: 'white',
        position: 'relative',
        zIndex: 1
      }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
          {topic.topicTitle || 'No Title'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2">
            <strong>Topic Code:</strong> {topic.topicCode}
          </Typography>
          <Typography variant="body2">
            <strong>Program:</strong> {topic.program || 'N/A'}
          </Typography>
          <Typography variant="body2">
            <strong>Component:</strong> {topic.component || 'N/A'}
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* TPOC Information */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              Topic Point of Contact
            </Typography>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
            {topic?.topicManagers?.map((manager: { name?: string; email?: string; phone?: string }, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography><strong>Name:</strong> {manager.name || 'N/A'}</Typography>
                    <Typography><strong>Email:</strong> {manager.email || 'N/A'}</Typography>
                    <Typography><strong>Phone:</strong> {manager.phone || 'N/A'}</Typography>
                  </Box>
                ))}
              ) : (
                <Typography>No contact information available</Typography>
              )
            </Paper>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Questions & Answers Section */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              Questions & Answers
            </Typography>
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 1, minHeight: '100px' }}>
              <Typography color="text.secondary">
                {topic.numQuestions ? (
                  `This topic has ${topic.numQuestions} published question(s).`
                ) : (
                  'No questions have been published for this topic yet.'
                )}
              </Typography>
              {/* We'll add the actual Q&A list here in the next step */}
            </Paper>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TopicDetailModal;
