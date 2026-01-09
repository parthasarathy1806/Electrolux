// src/components/ProjectSettings.js
import React from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Slider,
  Button,
} from "@mui/material";

export default function ProjectSettings({
  open,
  onClose,
  settings,
  updateSettings,
  allFields,
  defaultFields
}) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{
    sx: {
      marginTop: "64px",     // 👈 Push drawer below top menu bar
      height: "calc(100% - 64px)" // 👈 Adjust height to fit perfectly
    }
  }}>
      <Box sx={{ width: 360, p: 3 }}>
        
        <Typography variant="h6" mb={2}>Layout Settings</Typography>
        <Divider sx={{ mb: 2 }} />

        {/* GLOBAL SEARCH WIDTH */}
        <Typography fontWeight={600}>Global Search Width</Typography>
        <Slider
          value={settings.globalSearchWidth}
          onChange={(e, val) => updateSettings("globalSearchWidth", val)}
          min={200}
          max={1000}
          step={20}
          sx={{ my: 2 }}
        />

        <Divider sx={{ my: 2 }} />

        {/* DATE RANGE SETTINGS */}
        <Typography fontWeight={600}>Default Date Range</Typography>

        <TextField
          label="From Date"
          type="date"
          fullWidth
          value={settings.fromDate}
          sx={{ mt: 1 }}
          onChange={(e) => updateSettings("fromDate", e.target.value)}
        />

        <TextField
          label="To Date"
          type="date"
          fullWidth
          value={settings.toDate}
          sx={{ mt: 2 }}
          onChange={(e) => updateSettings("toDate", e.target.value)}
        />

        <Divider sx={{ my: 2 }} />

        {/* DEFAULT COLUMNS DROPDOWN */}
        <Typography fontWeight={600}>Default Visible Columns</Typography>

        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel>Columns</InputLabel>

          <Select
            multiple
            value={settings.defaultVisibleColumns}
            onChange={(e) =>
              updateSettings("defaultVisibleColumns", e.target.value)
            }
            input={<OutlinedInput label="Columns" />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((col) => (
                  <Chip key={col} label={col} size="small" />
                ))}
              </Box>
            )}
          >
            {allFields.map((col) => (
              <MenuItem key={col} value={col}>
                {col}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider sx={{ my: 3 }} />

        <Button
          variant="contained"
          fullWidth
          onClick={onClose}
        >
          Save Settings
        </Button>

      </Box>
    </Drawer>
  );
}
