import { RoleChannel } from '@/types/systemTypes';
import SelectAppContent from '@features/applications/components/SelectAppContent';
import { Box, Modal } from '@mui/material';
import { FC } from 'react';

interface AppSelectModalProps {
  open: boolean;
  onClose: () => void;
  channelData: RoleChannel[];
}

const AppSelectModal: FC<AppSelectModalProps> = ({ open, onClose, channelData }) => (
  <Modal open={open} onClose={onClose} aria-labelledby="app-select-modal-title">
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 1000,
        bgcolor: 'background.paper',
        boxShadow: 24,
        borderRadius: 2,
        p: 2,
      }}
    >
      <SelectAppContent channelData={channelData} />
    </Box>
  </Modal>
);

export default AppSelectModal;
