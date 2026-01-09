// src/components/JsonFormWizard.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tabs,
  Tab,
} from "@mui/material";
import axios from "axios";
import CustomDatePicker from "./CustomDatePicker";
import { useNavigate } from "react-router-dom";

/* ✅ Custom section components */
import ProjectFinancialTab from "./financial/ProjectFinancialTab";
import ProjectDocumentsTab from "./documents/ProjectDocumentsTab";
import ProjectReviewTab from "./review/ProjectReviewTab";

const JsonFormWizard = ({ formConfig }) => {
  const navigate = useNavigate();
  const { dataModel } = formConfig;
  const sections = (dataModel && dataModel.sections) || [];

  const [formData, setFormData] = useState({});
  const [dropdownData, setDropdownData] = useState({});
  const [collectionLookup, setCollectionLookup] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [projectIdError, setProjectIdError] = useState("");
  const [errors, setErrors] = useState({});

  const handleTabChange = (_, newValue) => setActiveTab(newValue);

  /* ---------------------------------------
     🔴 REQUIRED VALIDATION HELPERS
  ----------------------------------------*/
  const isFieldEmpty = (value) =>
    value === undefined ||
    value === null ||
    value === "" ||
    value === "N/A";

  const validateCurrentTab = () => {
    const sec = sections[activeTab];
    const newErrors = {};

    if (!sec?.groups) return newErrors;

    sec.groups.forEach((grp) => {
      grp.fields?.forEach((field) => {
        if (!field.required) return;
        if (!isVisible(field)) return;

        const value = formData[field.name];
        if (isFieldEmpty(value)) {
          newErrors[field.name] = true;
        }
      });
    });

    return newErrors;
  };

  const validateAllTabs = () => {
    const allErrors = {};
    sections.forEach((sec) => {
      sec?.groups?.forEach((grp) => {
        grp.fields?.forEach((field) => {
          if (!field.required) return;
          if (!isVisible(field)) return;

          const value = formData[field.name];
          if (isFieldEmpty(value)) {
            allErrors[field.name] = true;
          }
        });
      });
    });
    return allErrors;
  };

  /* ---------------------------------------
     PROJECT ID GENERATION (UNCHANGED)
  ----------------------------------------*/
  const generateProjectId = async (functionalGroupId) => {
    if (!functionalGroupId) return;

    const fgObj = (dropdownData.functionGroup || []).find(
      (f) => String(f._id) === String(functionalGroupId)
    );

    if (!fgObj?.functionalGroupName) return;

    const fgCode = fgObj.functionalGroupName.substring(0, 2).toUpperCase();
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");

    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE}/api/projects/next-id`,
        { params: { prefix: `${fgCode}${yy}${mm}` } }
      );

      setFormData((prev) => ({
        ...prev,
        projectId: res.data.projectId,
      }));
    } catch (err) {
      console.error("Failed to generate projectId", err);
    }
  };

  /* ---------------------------------------
     LOAD DROPDOWNS (UNCHANGED)
  ----------------------------------------*/
  useEffect(() => {
    let mounted = true;

    const gatherCollections = () => {
      const map = {};
      const collections = new Set();

      sections.forEach((sec) =>
        sec.groups?.forEach((grp) =>
          grp.fields?.forEach((field) => {
            if (field.type === "dropdown" && typeof field.options === "string") {
              map[field.name] = field.options;
              collections.add(field.options);
            }
          })
        )
      );

      return { map, collections: Array.from(collections) };
    };

    const loadAllDropdowns = async () => {
      const { map, collections } = gatherCollections();
      if (!collections.length) return;

      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE}/api/mongo/form-data`,
          {
            params: {
              collections: collections.join(","),
              status: "ACTIVE",
            },
          }
        );

        if (!mounted) return;

        const payload = res.data?.dropdowns || {};
        const ddByField = {};
        Object.entries(map).forEach(([fieldName, collectionName]) => {
          ddByField[fieldName] = payload[collectionName] || [];
        });

        setCollectionLookup(map);
        setDropdownData(ddByField);
        setFormData((prev) => ({
          ...prev,
          _lookupCache: payload, // 👈 THIS IS THE FIX
        }));
      } catch (err) {
        console.error("Failed to load dropdowns", err);
      }
    };

    loadAllDropdowns();
    return () => (mounted = false);
  }, [sections]);

  /* ---------------------------------------
     HANDLE CHANGE (UNCHANGED)
  ----------------------------------------*/
  const handleChange = (e, field) => {
    const { name, value, files } = e.target || {};
    setFormData((prev) => ({
      ...prev,
      [name]: field?.type === "file" ? files : value,
    }));

    setErrors((prev) => ({ ...prev, [name]: false }));

    if (name === "functionGroup") generateProjectId(value);
    if (name === "projectId") setProjectIdError("");
  };

  /* ---------------------------------------
     VISIBILITY LOGIC (UNCHANGED)
  ----------------------------------------*/
  const getLabelForDropdownValue = (fieldName, value, fieldConfig) => {
    const list = dropdownData[fieldName] || [];
    const obj = list.find((o) => String(o._id) === String(value));
    if (!obj) return "";
    if (fieldConfig?.displayField) return obj[fieldConfig.displayField];
    if (fieldConfig?.displayFields)
      return fieldConfig.displayFields.map((k) => obj[k]).join(" ");
    return obj.name || "";
  };

  const isVisible = (fieldOrGroup) => {
    if (!fieldOrGroup) return true;

    if (fieldOrGroup.visibleIf) {
      const [k, v] = Object.entries(fieldOrGroup.visibleIf)[0];
      return String(formData[k] || "") === String(v);
    }

    if (fieldOrGroup.visibleIfLabel_contains) {
      const [k, v] = Object.entries(fieldOrGroup.visibleIfLabel_contains)[0];
      const label = getLabelForDropdownValue(
        k,
        formData[k],
        sections
          .flatMap((s) => s.groups || [])
          .flatMap((g) => g.fields || [])
          .find((f) => f.name === k)
      );
      return label.toLowerCase().includes(v.toLowerCase());
    }

    if (fieldOrGroup.visibleIfLabel) {
      const [k, v] = Object.entries(fieldOrGroup.visibleIfLabel)[0];
      const label = getLabelForDropdownValue(
        k,
        formData[k],
        sections
          .flatMap((s) => s.groups || [])
          .flatMap((g) => g.fields || [])
          .find((f) => f.name === k)
      );
      return label.toLowerCase() === v.toLowerCase();
    }

    return true;
  };

  /* ---------------------------------------
     🔹 CUSTOM SECTION RENDERER (NEW)
  ----------------------------------------*/
  const renderCustomSection = (section) => {
    switch (section.title) {
      case "Financial":
        return (
          <ProjectFinancialTab
            formData={formData}
            setFormData={setFormData}
            mode="create"
          />
        );

      case "Documents":
        return (
          <ProjectDocumentsTab
            formData={formData}
            setFormData={setFormData}
          />
        );

      case "Review":
        return (
          <ProjectReviewTab
            formData={formData}
            section={section}
          />
        );

      default:
        return null;
    }
  };

  /* ---------------------------------------
     RENDER FIELD (UNCHANGED)
  ----------------------------------------*/
  const renderField = (field) => {
    if (!isVisible(field)) return null;
    const value = formData[field.name] ?? "";

    if (field.type === "text" || field.type === "textarea") {
      return (
        <TextField
          fullWidth
          name={field.name}
          label={field.label}
          value={value}
          error={!!errors[field.name]}
          helperText={errors[field.name] ? "Required" : ""}
          multiline={field.type === "textarea"}
          minRows={field.type === "textarea" ? 3 : 1}
          onChange={(e) => handleChange(e, field)}
        />
      );
    }

    if (field.type === "dropdown") {
      const items = Array.isArray(field.options)
        ? field.options
        : dropdownData[field.name] || [];

      return (
        <FormControl fullWidth error={!!errors[field.name]}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            name={field.name}
            value={value}
            label={field.label}
            onChange={(e) => handleChange(e, field)}
          >
            {items.map((opt, i) => {
              let optionLabel = "";

              if (field.displayField && opt?.[field.displayField] != null) {
                optionLabel = opt[field.displayField];
              } else if (field.displayFields) {
                optionLabel = field.displayFields
                  .map((k) => opt?.[k])
                  .filter(Boolean)
                  .join(" : ");
              } else {
                optionLabel = opt?.name ?? opt?.label ?? opt?._id ?? String(opt);
              }

              const optionValue = opt?._id ?? optionLabel;

              return (
                <MenuItem key={optionValue + "-" + i} value={optionValue}>
                  {optionLabel}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      );
    }

    if (field.type === "datePicker") {
      return (
        <CustomDatePicker
          label={field.label}
          name={field.name}
          value={value}
          error={!!errors[field.name]}
          helperText={errors[field.name] ? "Required" : ""}
          onChange={(e) =>
            handleChange(
              e?.target ? e : { target: { name: field.name, value: e } },
              field
            )
          }
        />
      );
    }

    if (field.type === "radio") {
      return (
        <>
          <Typography>{field.label}</Typography>
          <RadioGroup
            row
            name={field.name}
            value={value}
            onChange={(e) => handleChange(e, field)}
          >
            {field.options.map((o) => (
              <FormControlLabel
                key={o}
                value={o}
                control={<Radio />}
                label={o}
              />
            ))}
          </RadioGroup>
          {errors[field.name] && (
            <Typography color="error" variant="caption">
              Required
            </Typography>
          )}
        </>
      );
    }

    return null;
  };

  /* ---------------------------------------
     SUBMIT (UNCHANGED)
  ----------------------------------------*/
  const handleSubmit = async () => {
  if (projectIdError) {
    alert("Please resolve Project ID error");
    return;
  }

  const validationErrors = validateAllTabs();
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  try {
    setSubmitting(true);
    await axios.post(`${process.env.REACT_APP_API_BASE}/api/projects/create`, {
      metadata: formData,
      financial: formData.financial,
      documents: formData.documents || [],
    });
    navigate("/projects");
  } catch (err) {
    alert("Failed to save project");
  } finally {
    setSubmitting(false);
  }
};


  const isLast = activeTab === sections.length - 1;

  return (
    <Box>
      <Tabs value={activeTab} onChange={handleTabChange}>
        {sections.map((s, i) => (
          <Tab key={i} label={s.title} />
        ))}
      </Tabs>

      <Box mt={2}>
        {sections.map(
          (sec, idx) =>
            idx === activeTab && (
              <Box key={idx}>
                {["Financial", "Documents", "Review"].includes(sec.title)
                  ? renderCustomSection(sec)
                  : sec.groups?.map(
                      (grp, gIdx) =>
                        isVisible(grp) && (
                          <Box key={gIdx} mb={3}>
                            {grp.title && (
                              <Typography variant="h6">
                                {grp.title}
                              </Typography>
                            )}
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
                              {grp.fields?.map(renderField)}
                            </Box>
                          </Box>
                        )
                    )}
              </Box>
            )
        )}
      </Box>

      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button onClick={() => navigate("/projects")}>Cancel</Button>

        <Box>
          {activeTab > 0 && (
            <Button onClick={() => setActiveTab((t) => t - 1)}>
              Previous
            </Button>
          )}

          {!isLast && (
            <Button
              variant="contained"
              onClick={() => {
                const errs = validateCurrentTab();
                if (Object.keys(errs).length > 0) {
                  setErrors(errs);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  return;
                }
                setActiveTab((t) => t + 1);
              }}
            >
              Next
            </Button>
          )}

          {isLast && (
            <Button
              variant="contained"
              color="success"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Saving..." : "Submit"}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default JsonFormWizard;
