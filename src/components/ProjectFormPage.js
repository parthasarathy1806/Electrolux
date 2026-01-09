// src/components/ProjectFormPage.js
import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import JsonFormWizard from "./JsonFormWizard";
import projectForm from "../forms/project_form.json";

const ProjectFormPage = () => {
  return (
    <Box sx={{ width: "100%", p: 0, m: 0 }}>
      <Paper square
    elevation={0}
    sx={{
      p: 2,
      width: "100%",
      maxWidth: "100%",
      m: 0,
    }}>
        <Typography variant="h4" mb={2}>
          Project Components
        </Typography>

        <JsonFormWizard formConfig={projectForm} />
      </Paper>
    </Box>
  );
};

export default ProjectFormPage;
