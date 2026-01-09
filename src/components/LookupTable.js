// src/components/LookupTable.js
import React, { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Button,
  Typography,
  Radio,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import axios from "axios";
import { fetchGraphQLLookup } from "../api/graphqlAPI";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ClearIcon from "@mui/icons-material/Clear";
import UploadFileIcon from "@mui/icons-material/UploadFile"; // 🆕 Added
import * as XLSX from "xlsx"; // 🆕 Added for Excel handling
import LookupFormDialog from "./LookupFormDialog";
import "../components/css/LookupTable.css";

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "";
  if (isNaN(Number(value))) return value;
  return `$${Number(value).toLocaleString()}`;
}


const LookupTable = ({ config, lookupKey }) => {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editData, setEditData] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleDateString("en-US");
};

  // 🆕 Supplier Filter logic
  const [supplierFilter, setSupplierFilter] = useState("supplier"); // default PMS
  const isSupplierLookup = lookupKey === "supplier";

  // 🆕 Build dynamic API based on supplier filter
  const currentApi =
    isSupplierLookup && supplierFilter === "supplier_PUR"
      ? `${process.env.REACT_APP_API_BASE}/api/mongo/data/supplier_PUR`
      : config.mongoApi;

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
  let data = [];

  // Supplier special case uses REST because your API differs
  if (isSupplierLookup) {
    const dataRes = await axios.get(`${currentApi}?status=${statusFilter.toUpperCase()}`);
    data = dataRes.data;
  } else {
    // GraphQL OR REST fallback (dynamic)
    const graphqlLookupName =
  config.graphqlCollection || lookupKey;

    data = await fetchGraphQLLookup(
      graphqlLookupName,
      null,
      `${currentApi}?status=${statusFilter.toUpperCase()}`
    );
  }
  // Schema always via REST
  const schemaRes = await axios.get(config.schemaApi);
setSchema(schemaRes.data ?? {});
  if (!mounted) return;

  setSchema(schemaRes.data || null);
  const normalized = (data || []).filter((row) => {
  if (!statusFilter) return true;

  const statusKey = Object.keys(row).find((k) =>
    k.toLowerCase().endsWith("status")
  );

  return statusKey ? row[statusKey] === statusFilter : true;
});

  setRows(normalized);
  setFilteredRows(normalized);

} catch (err) {
        console.error("❌ Fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      mounted = false;
    };
  }, [config, statusFilter, currentApi, lookupKey, isSupplierLookup]); // ✅ Trigger fetch when supplier filter changes

  // 🔍 Global search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredRows(rows);
      return;
    }
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(lowerSearch)
      )
    );
    setFilteredRows(filtered);
  }, [searchTerm, rows]);

  const handleAdd = () => {
    setEditData(null);
    setOpenDialog(true);
  };

  const handleEdit = () => {
    if (!selectedRow) return alert("Please select a row to edit.");
    setEditData(selectedRow);
    setOpenDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedRow) return alert("Please select a row to inactivate.");
    if (!window.confirm("Are you sure you want to inactivate this item?")) return;

    try {
      const statusKey = Object.keys(selectedRow).find((k) =>
        k.toLowerCase().endsWith("status")
      );
      const payload = { ...selectedRow };
      if (statusKey) payload[statusKey] = "INACTIVE";

      await axios.put(`${currentApi}/${selectedRow._id}`, payload);

      const refreshed = await axios.get(`${currentApi}?status=${statusFilter.toUpperCase()}`);
      setRows(refreshed.data);
      setFilteredRows(refreshed.data);
      setSelectedRow(null);
      alert("Item inactivated successfully!");
    } catch (err) {
      console.error("❌ Error inactivating item:", err);
      alert("Failed to inactivate item.");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editData) {
        await axios.put(`${currentApi}/${editData._id}`, formData);
        alert("Updated successfully!");
      } else {
        await axios.post(currentApi, formData);
        alert("Added successfully!");
      }

      setOpenDialog(false);
      setEditData(null);

      const refreshed = await axios.get(`${currentApi}?status=${statusFilter.toUpperCase()}`);
      setRows(refreshed.data);
      setFilteredRows(refreshed.data);
    } catch (err) {
      console.error("❌ Error submitting form:", err);
      alert("Failed to save changes.");
    }
  };

  // 🆕 Excel Upload Logic
  const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      try {
      const activeCollection =
        supplierFilter === "supplier_PUR" ? "supplier_PUR" : "supplier";

        // ✅ Include both data and file name
        await axios.post(
          `${process.env.REACT_APP_API_BASE}/api/mongo/upload/${activeCollection}`,
          {
            data: jsonData,
            fileName: file.name, // ✅ send file name
          }
        );

        alert("✅ Data uploaded successfully!");

        // refresh table after upload
        const refreshed = await axios.get(`${currentApi}?status=${statusFilter}`);
          setRows(refreshed.data);
          setFilteredRows(refreshed.data);
      } catch (err) {
          console.error("❌ Upload failed:", err);
          alert("Upload failed. Please check your Excel format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };


  // 🆕 Sample Excel Download
  const downloadSampleFile = () => {
    const link = document.createElement("a");
    link.href = `${process.env.REACT_APP_API_BASE}/public/samples/Supplier%20Sample%20File.xlsx`;
    link.download = "Supplier Sample File.xlsx";
    link.click();
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!schema) {
    return (
      <Box textAlign="center" mt={5}>
        <Typography variant="h6" color="text.secondary">
          Schema not available.
        </Typography>
      </Box>
    );
  }

  const includeFields = config.includeFields || [];
  const columns = includeFields.map((key) => {
  const fieldConfig = config.fieldLabels?.[key];
  const col = {
    field: key,
    headerName:
      fieldConfig?.label ||
      config.fieldLabels?.[key] ||
      schema.properties?.[key]?.title ||
      key,
    width: fieldConfig?.width || undefined,
    flex: fieldConfig?.flex ?? 1,
    type: fieldConfig?.type || "string",
  };
/* 👉 Date formatting */
if (
  key.toLowerCase().includes("createdon") ||
  key.toLowerCase().includes("modifiedon") ||
  key.toLowerCase().includes("updatedon")
) {
  col.renderCell = (params) => formatDate(params.value);
}

  /* 👉 Detect numeric fields */
  if (!isNaN(Number(rows[0]?.[key]))) {
    col.type = "number";
    col.align = "right";
    col.headerAlign = "left";
  }

  /* 👉 Currency formatting */
  if (
    key.toLowerCase().includes("savings") ||
    key.toLowerCase().includes("amount") ||
    key.toLowerCase().includes("price") ||
    key.toLowerCase().includes("cost")
  ) {
    col.renderCell = (params) => formatCurrency(params.value);
    col.align = "right";
    col.headerAlign = "left";
  }

  return col;
});


  columns.unshift({
    field: "select",
    headerName: "",
    width: 70,
    renderCell: (params) => (
      <Radio
        checked={selectedRow?._id === params.row._id}
        onChange={() => setSelectedRow(params.row)}
        value={params.row._id}
      />
    ),
  });


  return (
    <Box sx={{ height: "80vh", width: "100%" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} px={1}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {config.displayName || schema.title || "Lookup Table"}
        </Typography>

        <Box display="flex" alignItems="center" gap={2}>
          {/* 🔍 Search */}
          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 250 }}
            InputProps={{
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          {/* ✅ Status Dropdown */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value.toUpperCase())}
            >
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="INACTIVE">INACTIVE</MenuItem>
            </Select>
          </FormControl>

          {/* 🆕 Supplier Filter Dropdown */}
          {isSupplierLookup && (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Supplier Type</InputLabel>
              <Select
                value={supplierFilter}
                label="Supplier Type"
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <MenuItem value="supplier">PMS Supplier</MenuItem>
                <MenuItem value="supplier_PUR">NonPMS Supplier</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* ➕ Add / ✏️ Edit / 🗑️ Delete */}
          {lookupKey !== "supplier" && (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{ mr: 1 }}
              >
                Add
              </Button>

              <IconButton color="secondary" onClick={handleEdit} disabled={!selectedRow}>
                <EditIcon />
              </IconButton>

              <IconButton color="error" onClick={handleDelete} disabled={!selectedRow}>
                <DeleteIcon />
              </IconButton>
            </>
          )}

          {/* 🆕 Upload Excel + Download Sample (Supplier only) */}
          {lookupKey === "supplier" && (
            <>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
              >
                Upload Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx, .xls"
                  onChange={(e) => handleFileUpload(e)}
                />
              </Button>

              <Button
                variant="outlined"
                onClick={downloadSampleFile}
                style={{ marginLeft: "10px" }}
              >
                Download Sample Excel
              </Button>
            </>
          )}
        </Box>
      </Box>

      <DataGrid
        sx={{
    "& .MuiDataGrid-columnHeaders": {
      minHeight: 60,
      maxHeight: 60,
    },
    "& .MuiDataGrid-columnHeader": {
      alignItems: "center !important",
      textAlign: "left",
      fontWeight: "bold",
      backgroundColor: "#fff",
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      fontWeight: "bold",
      fontSize: "0.95rem",
      whiteSpace: "normal",
      lineHeight: "1.2rem",
    },
  }}
        rows={filteredRows}
        columns={columns}
        getRowId={(row) => row._id}
        disableRowSelectionOnClick
        autoHeight
        /* ✅ Pagination settings */
  pagination
  pageSizeOptions={[10, 25, 50, 100]}
  initialState={{
    pagination: {
      paginationModel: {
        page: 0,
        pageSize: 10,   // ✅ DEFAULT = 10 rows
      },
    },
  }}
      />

      <LookupFormDialog
        open={openDialog}
        handleClose={() => setOpenDialog(false)}
        editData={editData}
        onSubmit={handleSubmit}
        schema={schema}
        lookupKey={lookupKey}
        includeFields={includeFields}
          config={config} // ✅ Add this line

      />
    </Box>
  );
};

export default LookupTable;
