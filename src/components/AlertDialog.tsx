import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
} from '@mui/material';

interface AlertDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        style: {
          backgroundColor: '#2A2B2D',
          color: '#fff',
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: '#ffffffcc' }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onCancel}
          sx={{ 
            color: '#ffffff99',
            '&:hover': { color: '#fff' }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          sx={{ 
            bgcolor: '#8AB4F8',
            '&:hover': { bgcolor: '#7AA3E7' }
          }}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertDialog;