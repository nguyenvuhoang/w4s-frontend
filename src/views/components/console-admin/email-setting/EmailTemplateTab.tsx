import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Modal, Button } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import React, { useState } from 'react';
import { MailTemplate } from '@/types/bankType';
import { getDictionary } from '@/utils/getDictionary';
import AddIcon from '@mui/icons-material/Add';

const EmailTemplateTab = ({ dictionary, templates, loading }: {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  templates: MailTemplate[],
  loading: boolean
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [selectedHTML, setSelectedHTML] = useState<string>('');

  const handleViewHTML = (html: string) => {
    setSelectedHTML(html);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedHTML('');
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center py-10">
        <Typography>Loading templates...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box className="flex justify-between items-center mb-2">
        <Typography variant="h5" className="mb-2 text-[#225087]">
          {dictionary['email'].emailtemplate}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          {dictionary['navigation'].add}
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#225087' }}>
              <TableCell sx={{ color: 'white' }}>ID</TableCell>
              <TableCell sx={{ color: 'white' }}>{dictionary['common'].description}</TableCell>
              <TableCell sx={{ color: 'white' }}>{dictionary['email'].subject}</TableCell>
              <TableCell sx={{ color: 'white' }}>{dictionary['email'].status}</TableCell>
              <TableCell sx={{ color: 'white' }}>{dictionary['email'].htmlbody}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((tpl) => (
              <TableRow key={tpl.template_id}>
                <TableCell>{tpl.template_id}</TableCell>
                <TableCell>{tpl.description}</TableCell>
                <TableCell>{tpl.subject}</TableCell>
                <TableCell>{tpl.status}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleViewHTML(tpl.body)}>
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg p-6 max-h-[90vh] overflow-auto w-[90vw]">
          <Typography variant="h6" className="mb-2">HTML Preview</Typography>
          <Box dangerouslySetInnerHTML={{ __html: selectedHTML }} />
        </Box>
      </Modal>
    </Box>
  );
};

export default EmailTemplateTab;
