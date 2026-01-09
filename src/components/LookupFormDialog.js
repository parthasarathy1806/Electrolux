// src/components/LookupFormDialog.js
import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import DynamicDropdown from "./DynamicDropdown";
import DROPDOWN_SOURCES from "./dropdownConfig";
import FIELD_LABELS from "./fieldLabels";
import { formRegistry } from "../config/formRegistry";

const LookupFormDialog = ({
  open,
  handleClose,
  editData,
  onSubmit,
  schema,
  lookupKey,
  includeFields = [],
  config,
}) => {
  const [formData, setFormData] = useState({});

  // ✅ Load form JSON (like subcommodity_form)
  const formConfig = lookupKey ? formRegistry[lookupKey.toLowerCase()] : null;

  // ✅ Get dropdown source mapping
  const dropdownMapping = useMemo(() => {
    return DROPDOWN_SOURCES[lookupKey?.toLowerCase()] || {};
  }, [lookupKey]);

  // ✅ Handle edit data
  useEffect(() => {
    if (editData) setFormData(editData);
    else setFormData({});
  }, [editData]);

  // ✅ Map labels → IDs for dropdowns
  useEffect(() => {
    const convertLabelsToIds = async () => {
      if (!editData || !Object.keys(dropdownMapping).length) return;
      const updatedFormData = { ...editData };

      for (const [fieldKey, cfg] of Object.entries(dropdownMapping)) {
        const currentValue = editData[fieldKey];
        if (!currentValue) continue;
        try {
          const res = await fetch(
            `${process.env.REACT_APP_API_BASE}/api/mongo/data/${cfg.collection}`
          );
          const data = await res.json();
          const match = data.find(
            (item) => item[cfg.labelField] === currentValue
          );
          if (match) updatedFormData[fieldKey] = match._id.toString();
        } catch (err) {
          console.warn(`Dropdown map fetch failed for ${fieldKey}`, err);
        }
      }
      setFormData(updatedFormData);
    };

    convertLabelsToIds();
  }, [editData, dropdownMapping]);

  const handleChange = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const labelOverrides = FIELD_LABELS[lookupKey?.toLowerCase()] || {};

  // ✅ Utility to render a field (used in both JSON & schema forms)
  const renderField = (field) => {
    const { name, label, type, placeholder, enum: enumValues, options, visibleIf, fields } = field;

    // Handle conditional visibility
    if (visibleIf) {
      const [condKey, condVal] = Object.entries(visibleIf)[0];
      if (formData[condKey] !== condVal) return null;
    }

    // Lookup dropdown
    if (type === "lookup" && field.lookup) {
      return (
        <DynamicDropdown
          key={name}
          label={label}
          value={formData[name] || ""}
          onChange={(val) => handleChange(name, val)}
          collection={field.lookup.sourceCollection}
          labelField={field.lookup.labelField}
        />
      );
    }

    // Radio button group
    if (type === "radio") {
      return (
        <FormControl key={name} margin="dense" fullWidth>
          <FormLabel>{label}</FormLabel>
          <RadioGroup
            value={formData[name] || field.defaultValue || ""}
            onChange={(e) => handleChange(name, e.target.value)}
            row
          >
            {options.map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio />}
                label={opt.label}
              />
            ))}
          </RadioGroup>
        </FormControl>
      );
    }

    // Select (enum)
    if (type === "select" && enumValues) {
      return (
        <FormControl fullWidth margin="dense" key={name}>
          <InputLabel>{label}</InputLabel>
          <Select
            value={formData[name] || field.defaultValue || ""}
            onChange={(e) => handleChange(name, e.target.value)}
            label={label}
          >
            {enumValues.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    // Nested group (for "Create New Commodity")
    if (type === "group" && fields?.length) {
      return (
        <div
          key={name}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "1rem",
            margin: "1rem 0",
          }}
        >
          {fields.map((nested) => renderField(nested))}
        </div>
      );
    }

    // Section (for grouping)
    if (type === "section" && fields?.length) {
      return (
        <div key={name} style={{ marginBottom: "1rem" }}>
          <h4>{label}</h4>
          {field.description && (
            <p style={{ fontSize: "0.9em", color: "#777" }}>
              {field.description}
            </p>
          )}
          {fields.map((sf) => renderField(sf))}
        </div>
      );
    }

    // Default text field
    return (
      <TextField
        key={name}
        fullWidth
        margin="dense"
        label={label}
        value={formData[name] || ""}
        onChange={(e) => handleChange(name, e.target.value)}
        placeholder={placeholder}
      />
    );
  };

  // ✅ Detect if JSON-based form should render
  if (formConfig?.fields?.length) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{formConfig.title}</DialogTitle>
        <DialogContent dividers>
          {formConfig.fields.map((field) => renderField(field))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            {formConfig.ui?.cancelButtonLabel || "Cancel"}
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              let payload = { ...formData };

              // Handle new commodity creation before submit
              if (payload.commodityRefType === "new" && payload.newCommodityGroup) {
                try {
                  const res = await fetch(
                    "http://localhost:4000/api/commodities",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload.newCommodityGroup),
                    }
                  );
                  const newCommodity = await res.json();
                  payload.commodityName = newCommodity._id;
                  delete payload.newCommodityGroup;
                } catch (err) {
                  console.error("Commodity creation failed:", err);
                }
              }

              await onSubmit(payload);
              handleClose();
            }}
          >
            {formConfig.ui?.submitButtonLabel || "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* 🚀 Fallback: Standard Schema-based form (default)                        */
  /* ------------------------------------------------------------------------ */
  if (!schema) return null;

  const backendOnlyFields = ["createdon", "modifiedon", "createdby", "modifiedby"];

  const fields = Object.entries(schema?.properties || {}).filter(([key]) => {
    const lowerKey = key.toLowerCase();
    if (backendOnlyFields.some((f) => lowerKey.includes(f))) return false;
    return includeFields.length > 0 ? includeFields.includes(key) : true;
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editData
          ? `Edit ${config?.displayName || lookupKey}`
          : `Add ${config?.displayName || lookupKey}`}
      </DialogTitle>
      <DialogContent dividers>
        {fields.map(([key, fieldSchema]) => {
          const label = labelOverrides[key] || fieldSchema.title || key;
          const placeholder = fieldSchema.description || "";
          const type = fieldSchema.type || "string";

          const dropdownConfig = dropdownMapping[key];
          if (dropdownConfig) {
            return (
              <DynamicDropdown
                key={key}
                label={label}
                value={formData[key] || ""}
                onChange={(val) => handleChange(key, val?.toString())}
                collection={dropdownConfig.collection}
                labelField={dropdownConfig.labelField}
              />
            );
          }

          if (fieldSchema.enum) {
            return (
              <FormControl fullWidth margin="dense" key={key}>
                <InputLabel>{label}</InputLabel>
                <Select
                  value={formData[key] || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  label={label}
                >
                  {fieldSchema.enum.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }

          return (
            <TextField
              key={key}
              fullWidth
              margin="dense"
              label={label}
              value={formData[key] || ""}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              type={type === "number" ? "number" : "text"}
            />
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSubmit(formData)}>
          {editData ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LookupFormDialog;
