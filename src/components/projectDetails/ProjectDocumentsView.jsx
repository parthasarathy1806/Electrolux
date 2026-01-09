import React from "react";
import { Box, Typography } from "@mui/material";

const ProjectDocumentsView = ({ documents }) => {
  if (!documents?.length) {
    return (
      <Typography>No documents uploaded for this project.</Typography>
    );
  }

  return (
    <Box>
      {documents.map((d, i) => (
        <Box key={i} p={2} border="1px solid #ddd" mb={1}>
          <Typography>File: {d.fileName}</Typography>
          <Typography>Type: {d.documentType}</Typography>
          <Typography>Uploaded By: {d.uploadedBy}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default ProjectDocumentsView;
