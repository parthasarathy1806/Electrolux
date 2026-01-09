import React from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Paper,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import dayjs from "dayjs";

const REASONS = [
  "New Project",
  "Moved Start Date In",
  "Moved Start Date Out",
  "Removed Project",
  "Project Completed",
  "Split Project",
  "Revised Description",
  "Revised Supplier",
  "Revised Status",
  "Revised Savings",
];

// 🔑 convert camelCase → Label
const formatLabel = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase());

const ReviewChangesTab = ({ formData, changes, totals, onBack }) => {
  return (
    <Box p={2}>
      {/* Back button */}
      <Box textAlign="right">
        <IconButton onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
      </Box>

      <Typography variant="h6" mb={2}>
        Review Changes
      </Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        {/* Header row */}
        <Box
          display="grid"
          gridTemplateColumns="1fr 1fr 1fr 1fr"
          mb={2}
        >
          <Typography>
            <strong>ProjectID:</strong> {formData.projectId}
          </Typography>
          <Typography>
            <strong>Project Description:</strong> {formData.description}
          </Typography>
          <Typography>
            <strong>Entered:</strong> {dayjs().format("DD/MM/YYYY")}
          </Typography>
          <Typography>
            <strong>Next Status:</strong> APPROVED
          </Typography>
        </Box>

        {/* Table header */}
        <Box
          display="grid"
          gridTemplateColumns="2fr 3fr 40px"
          fontWeight={700}
          borderBottom="1px solid #ddd"
          pb={1}
          mb={1}
        >
          <Typography>Field</Typography>
          <Typography>Change</Typography>
          <Typography />
        </Box>

        {/* Dynamic changes */}
        {changes.map((c, idx) => (
          <Box
            key={idx}
            display="grid"
            gridTemplateColumns="2fr 3fr 40px"
            alignItems="center"
            py={1}
            borderBottom="1px solid #f0f0f0"
          >
            <Typography fontStyle="italic">
              {formatLabel(c.field)}
            </Typography>

            <Typography>
              <span style={{ color: "red", marginRight: 6 }}>
                {String(c.oldValue)}
              </span>
              →
              <span style={{ color: "green", marginLeft: 6 }}>
                {String(c.newValue)}
              </span>
            </Typography>

            <IconButton size="small" disabled>
              <CloseIcon color="error" />
            </IconButton>
          </Box>
        ))}

        {/* Bottom section */}
        <Box
          mt={3}
          display="grid"
          gridTemplateColumns="2fr 2fr 1fr"
          gap={2}
          alignItems="flex-start"
        >
          {/* Reason & Comments */}
          <Box>
            <TextField
              select
              label="Reason"
              fullWidth
              margin="dense"
            >
              {REASONS.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Comments"
              multiline
              minRows={3}
              fullWidth
              margin="dense"
            />
          </Box>

          {/* Financial summary */}
          <Box>
            <Typography fontWeight={700}>
              ${totals.annualized?.toLocaleString()}
            </Typography>
            <Typography>Total Annualized</Typography>

            {Object.entries(totals.yearly || {}).map(([y, v]) => (
              <Box key={y} mt={1}>
                <Typography fontWeight={700}>
                  ${v.toLocaleString()}
                </Typography>
                <Typography>Total {y}</Typography>
              </Box>
            ))}
          </Box>

          {/* Accept */}
          <Box textAlign="right">
            <Button variant="contained" color="success">
              Accept
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ReviewChangesTab;
