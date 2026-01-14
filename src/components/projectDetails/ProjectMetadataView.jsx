// src/components/projectDetails/ProjectMetadataView.jsx
import React from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import CustomDatePicker from "../CustomDatePicker";


const getOptionValue = (opt) =>
  String(
    opt._id ??
    opt.id ??
    opt.value ??
    opt.projectStatusValue ??
    ""
  );

/* ✅ Editable fields */
const EDITABLE_METADATA_FIELDS = new Set([
  "activityType",
  "activitySubType",
  "operationsMode",
  "operationsSubMode",
  "plCostType",
  "financialCategory",
  "projectId",
  "description",
  "pprfSwingNumber",
  "pprf",
  "ecn",
  "startDate",
  "risk",
  "status",
  "comment",
  "bigRocks",
  "purchasingAgent",
  "costOutEngineer",
  "projectOwner",
  "supplierName",
  "tier2Supplier",
  "subcommodity",
  "idco",
  "brand",
  "inPlan",
]);

/* 🔑 Normalize ObjectId → string */
const normalizeOptions = (list = []) =>
  list.map((o) => ({
    ...o,
    _id: o?._id != null ? String(o._id) : o,
  }));

const ProjectMetadataView = ({
  sections,
  formData,
  setFormData,
  dropdownData,
  mode = "details",
}) => {
  const isEditable = (name) =>
    mode === "create" || EDITABLE_METADATA_FIELDS.has(name);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const renderField = (field) => {
    const value = formData[field.name] != null
      ? String(formData[field.name])
      : "";
    const editable = isEditable(field.name);

    /* TEXT / TEXTAREA */
    if (field.type === "text" || field.type === "textarea") {
      return (
        <TextField
          fullWidth
          label={field.label}
          value={value}
          multiline={field.type === "textarea"}
          minRows={field.type === "textarea" ? 3 : 1}
          onChange={(e) => handleChange(field.name, e.target.value)}
          InputProps={{ readOnly: !editable }}
        />
      );
    }

    /* DROPDOWN */
    if (field.type === "dropdown") {
      const rawOptions = Array.isArray(field.options)
        ? field.options
        : dropdownData[field.name] || [];

      const options = normalizeOptions(rawOptions);

      return (
        <FormControl fullWidth disabled={!editable}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            label={field.label}
            value={value ?? ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
          >
            {options.map((opt) => {
              let optionLabel = "";

              if (field.displayField && opt[field.displayField] != null) {
                optionLabel = opt[field.displayField];
              } else if (
                field.displayFields &&
                Array.isArray(field.displayFields)
              ) {
                optionLabel = field.displayFields
                  .map((k) => opt[k])
                  .filter(Boolean)
                  .join(" : ");
              } else {
                optionLabel =
                  opt?.name ?? opt?.label ?? String(opt._id ?? opt);
              }

              return (
                <MenuItem key={getOptionValue(opt)} value={getOptionValue(opt)}>
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
        <RadioGroup
          row
          value={value}
          onChange={(e) => handleChange(field.name, e.target.value)}
        >
          {(field.options || []).map((o) => (
            <FormControlLabel
              key={o}
              value={o}
              control={<Radio />}
              label={o}
              disabled={!editable}
            />
          ))}
        </RadioGroup>
      );
    }

    /* DATE */
    if (field.type === "datePicker") {
      return (
        <CustomDatePicker
          label={field.label}
          value={value}
          onChange={(val) => handleChange(field.name, val)}
          disabled={!editable}
        />
      );
    }

    return null;
  };

  return (
    <>
      {sections.map((grp, gIdx) => (
        <Box key={gIdx} mb={3}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                grp.layout === "two-column"
                  ? { xs: "1fr", md: "1fr 1fr" }
                  : "1fr",
              gap: 2,
            }}
          >
            {grp.fields.map((field) => (
              <Box key={field.name}>{renderField(field)}</Box>
            ))}
          </Box>
        </Box>
      ))}
    </>
  );
};

export default ProjectMetadataView;
