// src/components/DynamicDropdown.js
import React, { useEffect, useState } from "react";
import { FormControl, InputLabel, Select, MenuItem, CircularProgress } from "@mui/material";

const DynamicDropdown = ({ label, value, onChange, collection, labelField }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE}/api/mongo/data/${collection}`);
        const data = await res.json();
        setOptions(
          data.map((item) => ({
            id: item._id?.toString(),
            label: item[labelField] || item.name || item._id?.toString(), // ✅ fallback label
          }))
        );
      } catch (err) {
        console.error(`Failed to fetch ${collection}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [collection, labelField]);
  

  if (loading) {
    return (
      <FormControl fullWidth margin="dense">
        <InputLabel>{label}</InputLabel>
        <Select disabled value="">
          <MenuItem value="">
            <CircularProgress size={20} />
          </MenuItem>
        </Select>
      </FormControl>
    );
  }

  return (
    <FormControl fullWidth margin="dense">
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        label={label}
      >
        <MenuItem value="">
          <em>Select {label}</em>
        </MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt.id} value={opt.id}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default DynamicDropdown;
