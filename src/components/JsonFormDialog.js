// src/components/JsonFormDialog.js
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
} from "@mui/material";
import axios from "axios";
import CustomDatePicker from "./CustomDatePicker";
import { Tabs, Tab } from "@mui/material";

const JsonFormDialog = ({ open, handleClose, formConfig }) => {
  const [formData, setFormData] = useState({});
  const [dropdownData, setDropdownData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_, newValue) => setActiveTab(newValue);

  const { title, description, dataModel, actions } = formConfig || {};

  /* ------------------------------------------------------------
     FETCH DROPDOWN DATA (ACTIVE ONLY)
  ------------------------------------------------------------- */
  useEffect(() => {
    if (!dataModel || !dataModel.sections) return;

    const fetchDropdownData = async () => {
      const dropdowns = {};

      for (const section of dataModel.sections) {
        if (!section.groups) continue;

        for (const group of section.groups) {
          for (const field of group.fields) {
            if (field.type === "dropdown" && typeof field.options === "string") {
              try {
                const res = await axios.get(
                  `${process.env.REACT_APP_API_BASE}/api/mongo/data/${field.options}?status=ACTIVE`
                );
                dropdowns[field.name] = res.data;
              } catch (err) {
                console.error(`❌ Failed to load options for ${field.name}`, err);
              }
            }
          }
        }
      }

      setDropdownData(dropdowns);
    };

    fetchDropdownData();
  }, [dataModel]);

  /* ------------------------------------------------------------
     HANDLE FIELD CHANGES
  ------------------------------------------------------------- */
  const handleChange = (e, field) => {
    const { name, value, files } = e.target;

    if (field.type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  /* ------------------------------------------------------------
     SUBMIT FORM DATA
  ------------------------------------------------------------- */
  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const formPayload = new FormData();
      for (const key in formData) {
        if (formData[key] instanceof FileList) {
          Array.from(formData[key]).forEach((file) => {
            formPayload.append(key, file);
          });
        } else {
          formPayload.append(key, formData[key]);
        }
      }

      await axios.post(
        `${process.env.REACT_APP_API_BASE}/api/mongo/data/${dataModel.collection}`,
        formPayload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("✅ Project saved successfully!");
      handleClose();
    } catch (err) {
      console.error("❌ Error saving form:", err);
      alert("Failed to save project. Please check required fields or backend.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!formConfig) return null;

  /* ------------------------------------------------------------
     FIELD RENDERER — Responsible for rendering ALL FIELD TYPES
  ------------------------------------------------------------- */
  const renderField = (field, fIndex) => {
    const value = formData[field.name] || "";
    const isRequired = field.required ? { required: true } : {};

    /* TEXT, NUMBER, DATE, TEXTAREA */
    if (["text", "number", "date", "textarea"].includes(field.type)) {
      return (
        <Box key={fIndex} mb={2}>
          {field.type === "textarea" ? (
            <TextField
              fullWidth
              multiline
              minRows={3}
              name={field.name}
              label={field.label}
              value={value}
              onChange={(e) => handleChange(e, field)}
              {...isRequired}
            />
          ) : (
            <TextField
              fullWidth
              type={field.type}
              name={field.name}
              label={field.label}
              value={value}
              onChange={(e) => handleChange(e, field)}
              {...isRequired}
            />
          )}
        </Box>
      );
    }

    /* DATE PICKER */
    if (field.type === "datePicker") {
      return (
        <Box key={fIndex} mb={2}>
          <CustomDatePicker
            label={field.label}
            name={field.name}
            value={value}
            onChange={(e) => handleChange(e, field)}
          />
        </Box>
      );
    }

    /* DROPDOWN */
    /* DROPDOWN */
if (field.type === "dropdown") {
  const options = Array.isArray(field.options)
    ? field.options
    : dropdownData[field.name] || [];

  return (
    <FormControl fullWidth key={fIndex} sx={{ mb: 2 }}>
      <InputLabel>{field.label}</InputLabel>

      <Select
        name={field.name}
        value={value}
        label={field.label}
        onChange={(e) => handleChange(e, field)}
      >
        {options.map((opt, i) => {
          let optionValue = opt._id;
          let optionLabel = "";

          /* CASE 1: SINGLE displayField */
          if (field.displayField) {
            optionLabel = opt[field.displayField];
          }

          /* CASE 2: MULTIPLE displayFields → COMBINE */
          else if (field.displayFields && Array.isArray(field.displayFields)) {
            optionLabel = field.displayFields
              .map((key) => opt[key])
              .filter(Boolean)
              .join(": ");
          }

          /* DEFAULT */
          else {
            optionLabel = opt.name || opt.label || optionValue;
          }

          return (
            <MenuItem key={i} value={optionValue}>
              {optionLabel}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}


    /* RADIO */
    if (field.type === "radio") {
      return (
        <FormControl key={fIndex} sx={{ mb: 2 }}>
          <Typography>{field.label}</Typography>

          <RadioGroup
            name={field.name}
            value={value}
            onChange={(e) => handleChange(e, field)}
            row
          >
            {field.options.map((opt, i) => (
              <FormControlLabel
                key={i}
                value={opt}
                control={<Radio />}
                label={opt}
              />
            ))}
          </RadioGroup>
        </FormControl>
      );
    }

    /* FILE UPLOAD */
    if (field.type === "file") {
      return (
        <Box key={fIndex} mb={2}>
          <Typography>{field.label}</Typography>

          <input
            type="file"
            name={field.name}
            multiple={field.multiple}
            onChange={(e) => handleChange(e, field)}
          />
        </Box>
      );
    }

    return null;
  };

  /* ------------------------------------------------------------
     MAIN UI RETURN
  ------------------------------------------------------------- */
  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {description}
        </Typography>

        {/* -------------------------------------------
            TOP-LEVEL TABS (Metadata, Financial, etc.)
        ------------------------------------------- */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: "1px solid #ddd" }}
        >
          {dataModel.sections.map((section, i) => (
            <Tab key={i} label={section.title} />
          ))}
        </Tabs>

        {/* -------------------------------------------
            TAB CONTENT (Each tab contains vertical groups)
        ------------------------------------------- */}
        {dataModel.sections.map((section, sIndex) => (
          <Box
            key={sIndex}
            role="tabpanel"
            hidden={activeTab !== sIndex}
            sx={{ mt: 2 }}
          >
            {activeTab === sIndex && (
              <>
                {section.groups?.map((group, gIndex) => (
                  <Box key={gIndex} mb={4}>
                    {/* SECTION TITLE */}
                    <Typography
                      variant="subtitle1"
                      sx={{ mb: 1, fontWeight: "bold", color: "primary.main" }}
                    >
                      {group.title}
                    </Typography>

                    {/* RENDER ALL FIELDS IN THIS VERTICAL GROUP */}
                    {group.fields.map((field, fIndex) =>
                      renderField(field, fIndex)
                    )}
                  </Box>
                ))}
              </>
            )}
          </Box>
        ))}
      </DialogContent>

      {/* -------------------------------------------
          ACTION BUTTONS
      ------------------------------------------- */}
      <DialogActions>
        {actions?.map((action, idx) => {
          if (action.type === "submit") {
            return (
              <Button
                key={idx}
                onClick={handleSubmit}
                variant="contained"
                disabled={submitting}
              >
                {submitting ? "Saving..." : action.label}
              </Button>
            );
          }

          if (action.type === "cancel") {
            return (
              <Button key={idx} onClick={handleClose} variant="outlined">
                {action.label}
              </Button>
            );
          }

          return null;
        })}
      </DialogActions>
    </Dialog>
  );
};

export default JsonFormDialog;
