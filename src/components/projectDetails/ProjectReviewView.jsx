import React from "react";
import { Typography } from "@mui/material";

const ProjectReviewView = ({ metadata, financial }) => {
  return (
    <>
      <Typography>
        This project is a <strong>{metadata.operationsGroup}</strong>{" "}
        project starting on{" "}
        <strong>
          {new Date(metadata.startDate).toLocaleDateString()}
        </strong>
        .
      </Typography>

      <Typography mt={2}>
        Total Annualized Savings:{" "}
        <strong>
          ${metadata.Estimated_Annualized_Savings?.toLocaleString()}
        </strong>
      </Typography>
    </>
  );
};

export default ProjectReviewView;
