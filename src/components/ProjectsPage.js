// src/components/ProjectsPage.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputLabel,
  FormControl,
  Chip,
  OutlinedInput,
  Grid,
  Paper,
  Select,
  MenuItem,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/FileDownload";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import "./css/ProjectsPage.css";
import { useNavigate } from "react-router-dom";
import { fetchGraphQLLookup } from "../api/graphqlAPI";
import ProjectSettings from "./ProjectSettings";
import SettingsIcon from "@mui/icons-material/Settings";

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "";
  if (isNaN(Number(value))) return value;
  return `$${Number(value).toLocaleString()}`;
}

/* ===========================
   Default visible columns
   =========================== */
const DEFAULT_COLUMNS = [
  { field: "ProjectID", headerName: "Project ID", flex: 1, minWidth: 180, sortable: true },
  { field: "projectNumber", headerName: "Project Number", flex: 1, minWidth: 140, sortable: true },
  { field: "Project_Description", headerName: "Project Description", flex: 2, minWidth: 260, sortable: true },
  { field: "Estimated_Annualized_Savings", headerName: "Annual Savings", flex: 1, minWidth: 160, sortable: true },
  {
    field: "Start_Date",
    headerName: "Start Date",
    flex: 1,
    minWidth: 140,
    sortable: true,
  },
];

const DEFAULT_FIELD_KEYS = DEFAULT_COLUMNS.map((c) => c.field);

const LOOKUP_FIELD_MAP = {
  brand: "brand",
  location: "locations",
  productLine: "productProductLine",
  supplierName: "supplier",
  tier2Supplier: "supplier_PUR",
  subcommodity: "subcommodity",
  idco: "idcotable",
  functionalGroup: "functionalGroup",
  operationsGroup: "opsgroup",
  operationsSubGroup: "opssubgroup",
  conversionMode: "conversionOpsMode",
  projectOwner: "usersClean",
  purchasingAgent: "usersClean",
  costOutEngineer: "usersClean",
};

const PREFERRED_LABEL_FIELD = {
  brand: "brandName",
  locations: "locationName",
  productProductLine: "name",
  supplier: "supplierName",
  supplier_PUR: "supplierName",
  subcommodity: "subcommodityName",
  idcotable: "idcoTableName",
  functionalGroup: "functionalGroupName",
  opsgroup: "opsGroupName",
  opssubgroup: "opsGroupName",
  conversionOpsMode: "conversionOpsModeName",
  usersClean: "firstName",
};

const SYSTEM_FIELDS = new Set([
  "_id", "__v", "createdOn", "createdBy", "modifiedOn", "modifiedBy",
  "createdon", "createdby", "modifiedon", "modifiedby",
]);

export default function ProjectsPage() {
  const navigate = useNavigate();

  // Settings drawer state
  const [openSettings, setOpenSettings] = useState(false);
  const [settings, setSettings] = useState({
    expandGlobalSearch: false,
    globalSearchWidth: 300,
    fromDate: "2000-01-01",
    toDate: "2099-12-31",
    defaultVisibleColumns: DEFAULT_FIELD_KEYS,
  });

  const updateSettings = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [projectIdFilter, setProjectIdFilter] = useState("");
  const [projectDescFilter, setProjectDescFilter] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [startDateFrom, setStartDateFrom] = useState(dayjs("2000-01-01"));
  const [startDateTo, setStartDateTo] = useState(dayjs("2099-12-31"));

  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_FIELD_KEYS);
  const [allFields, setAllFields] = useState([...DEFAULT_FIELD_KEYS]);
  const [lookupCache, setLookupCache] = useState({});

  const API_BASE = process.env.REACT_APP_API_BASE;
  const collectionName = "projectCreate";

  /* Load top 100 projects */
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${API_BASE}/api/mongo/data/${collectionName}?limit=100`;
      const res = await axios.get(url);
      const raw = Array.isArray(res.data) ? res.data : [];

      const fieldSet = new Set(DEFAULT_FIELD_KEYS);

      const rows = raw.map((r) => {
        const row = { ...r };
        row.id = r._id || r.ProjectID || r.projectNumber;

        row._annual = Number(
          r.Estimated_Annualized_Savings ??
          r.Revised_Annualized_Savings ??
          r.EA1 ??
          r.annualSavings ??
          0
        );

        // Date formatting
        const rawDate =
          r.Start_Date ?? r.StartDate ?? r.Revised_Start_Date ?? null;

        row._start = rawDate ? new Date(rawDate) : null;
        row.Start_Date = row._start ? dayjs(row._start).format("MM/DD/YYYY") : "";

        // discover extra fields
        Object.keys(r).forEach((k) => {
          if (!SYSTEM_FIELDS.has(k)) fieldSet.add(k);
        });

        return row;
      });

      setProjects(rows);

      // Order fields: defaults first
      const union = Array.from(fieldSet);
      const extras = union.filter((f) => !DEFAULT_FIELD_KEYS.includes(f));
      extras.sort();
      const ordered = [...DEFAULT_FIELD_KEYS, ...extras];
      setAllFields(ordered);

      // Restore visibleColumns preserving defaults
      setVisibleColumns((prev) => {
        const merged = Array.from(new Set([...DEFAULT_FIELD_KEYS, ...(prev || [])]));
        return ordered.filter((k) => merged.includes(k));
      });
    } catch (err) {
      console.error("Error fetching projects:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, collectionName]);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only once

  /* Preload lookup collections */
  useEffect(() => {
    let mounted = true;

    const collectionsToLoad = Array.from(new Set(Object.values(LOOKUP_FIELD_MAP)));

    const loadAll = async () => {
      try {
        const promises = collectionsToLoad.map(async (col) => {
          const fallbackUrl = `${API_BASE}/api/mongo/data/${col}?limit=500`;
          const data = await fetchGraphQLLookup(col, fallbackUrl);
          const normalized = Array.isArray(data)
            ? data.map((d) => ({ ...d, _id: String(d._id || "") }))
            : [];
          return [col, normalized];
        });

        const results = await Promise.all(promises);
        if (!mounted) return;

        const obj = {};
        results.forEach(([k, v]) => (obj[k] = v));
        setLookupCache(obj);
      } catch (err) {
        console.error("Failed to load lookup collections", err);
      }
    };

    loadAll();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Lookup resolver */
  const resolveLookupLabel = (fieldName, cellValue) => {
    if (!cellValue) return "";
    const coll = LOOKUP_FIELD_MAP[fieldName];
    if (!coll) return String(cellValue);

    const list = lookupCache[coll] || [];
    const found = list.find(
      (it) => String(it._id) === String(cellValue) ||
        Object.values(it).some((v) => String(v) === String(cellValue))
    );

    if (!found) return String(cellValue);

    const pref = PREFERRED_LABEL_FIELD[coll];
    return found[pref] || found.name || found.label || found.displayName || found._id;
  };

  /* Build DataGrid columns */
  const columns = useMemo(() => {
    return visibleColumns.map((field) => {
      const def = DEFAULT_COLUMNS.find((c) => c.field === field);
      if (def) {
        const col = { ...def };

        if (!isNaN(Number(projects[0]?.[field]))) {
          col.type = "number";
          col.align = "right";
          col.headerAlign = "left";
        }

        if (
          field.toLowerCase().includes("savings") ||
          field.toLowerCase().includes("amount") ||
          field.toLowerCase().includes("price") ||
          field.toLowerCase().includes("cost")
        ) {
          col.renderCell = (params) => formatCurrency(params.value);
          col.align = "right";
          col.headerAlign = "left";
        }

        if (field === "ProjectID") {
          col.renderHeader = () => (
            <Box sx={{ display: "flex", flexDirection: "column",gap: 0.5, width: "100%"  }}>
              <Typography sx={{ fontWeight: 600,fontSize: "0.95rem"  }}>Project ID</Typography>
              <TextField
                size="small"
                placeholder="Filter…"
                value={projectIdFilter}
                onChange={(e) => setProjectIdFilter(e.target.value)}
                sx={{width: "100%"}}
              />
            </Box>
          );
        }

        if (field === "Project_Description") {
          col.renderHeader = () => (
            <Box sx={{ display: "flex", flexDirection: "column",gap: 0.5, width: "100%" }}>
              <Typography sx={{ fontWeight: 600,fontSize: "0.95rem"}}>Project Description</Typography>
              <TextField
                size="small"
                placeholder="Filter…"
                value={projectDescFilter}
                onChange={(e) => setProjectDescFilter(e.target.value)}
                sx={{width: "100%" }}
              />
            </Box>
          );
        }

        return col;
      }

      // dynamic columns
      const col = {
        field,
        headerName: field.replace(/([A-Z])/g, " $1"),
        flex: 1,
        minWidth: 160,
      };

      if (!isNaN(Number(projects[0]?.[field]))) {
        col.type = "number";
        col.align = "right";
        col.headerAlign = "left";
      }

      if (
        field.toLowerCase().includes("savings") ||
        field.toLowerCase().includes("amount") ||
        field.toLowerCase().includes("price") ||
        field.toLowerCase().includes("cost")
      ) {
        col.renderCell = (params) => formatCurrency(params.value);
        col.align = "right";
        col.headerAlign = "left";
      }

      if (LOOKUP_FIELD_MAP[field]) {
        col.renderCell = (params) => resolveLookupLabel(field, params.row[field]);
      }

      if (field.toLowerCase().includes("date")) {
        col.type = "string";
        col.renderCell = (params) => params.row[field] ?? "";
      }

      return col;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleColumns, lookupCache, projectIdFilter, projectDescFilter, projects]);

  /* Filtering */
  const filteredRows = useMemo(() => {
    return projects.filter((r) => {
      if (r._start) {
        const d = dayjs(r._start);
        if (!d.isBetween(startDateFrom, startDateTo, "day", "[]")) return false;
      }

      if (globalSearch) {
        const q = globalSearch.toLowerCase();
        const hay = [r.ProjectID, r.projectNumber, r.Project_Description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (
        projectIdFilter &&
        !String(r.ProjectID || "").toLowerCase().includes(projectIdFilter.toLowerCase())
      ) return false;

      if (
        projectDescFilter &&
        !String(r.Project_Description || "").toLowerCase().includes(projectDescFilter.toLowerCase())
      ) return false;

      return true;
    });
  }, [
    projects,
    globalSearch,
    projectIdFilter,
    projectDescFilter,
    startDateFrom,
    startDateTo,
  ]);

  /* Column chooser handler */
  const handleColumnChange = (e) => {
    const selected = Array.isArray(e.target.value) ? e.target.value : [];
    const final = [...DEFAULT_FIELD_KEYS, ...selected.filter((f) => !DEFAULT_FIELD_KEYS.includes(f))];
    setVisibleColumns(final);
  };

  /* Export */
  const exportExcel = () => {
    const rowsToExport = filteredRows.map((r) =>
      visibleColumns.reduce((acc, key) => {
        acc[key] = LOOKUP_FIELD_MAP[key]
          ? resolveLookupLabel(key, r[key])
          : r[key] ?? "";
        return acc;
      }, {})
    );

    const ws = XLSX.utils.json_to_sheet(rowsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projects");
    XLSX.writeFile(wb, "projects.xlsx");
  };

  /* ------------------------------------
     APPLY SETTINGS → UI SYNC
  -------------------------------------*/

  // Sync default date range (From/To dates)
  useEffect(() => {
    setStartDateFrom(dayjs(settings.fromDate));
    setStartDateTo(dayjs(settings.toDate));
  }, [settings.fromDate, settings.toDate]);

  // Sync default visible columns
  useEffect(() => {
    if (settings.defaultVisibleColumns?.length > 0) {
      setVisibleColumns(settings.defaultVisibleColumns);
    }
  }, [settings.defaultVisibleColumns]);

  // Optional: reset filters when settings change
  useEffect(() => {
    setGlobalSearch("");
    setProjectIdFilter("");
    setProjectDescFilter("");
  }, [settings]);

  return (
    <Box>
      {/* Top Heading + Actions Row */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        {/* LEFT — Heading */}
        <Typography variant="h4">Projects</Typography>

        {/* RIGHT — Action Buttons */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => navigate("/projects/new")}>
            New Project
          </Button>

          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={fetchProjects}>
            Refresh
          </Button>

          <Button startIcon={<DownloadIcon />} variant="outlined" onClick={exportExcel}>
            Export
          </Button>

          {/* Settings Button (new) */}
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setOpenSettings(true)}
          >
            Settings
          </Button>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Global search */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Global search..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              sx={{ width: settings.globalSearchWidth }}
            />
          </Grid>

          {/* Date range */}
          <Grid item xs={12} md={3}>
            <Box display="flex" gap={1}>
              <DatePicker label="Start Date" value={startDateFrom} onChange={(d) => setStartDateFrom(d)} slotProps={{ textField: { size: "small" } }} />
              <DatePicker label="To" value={startDateTo} onChange={(d) => setStartDateTo(d)} slotProps={{ textField: { size: "small" } }} />
            </Box>
          </Grid>

          {/* Column chooser */}
          <Grid item xs={12} md={5}>
            <FormControl fullWidth size="small" sx={{ minWidth: 600 }}>
              <InputLabel>Columns</InputLabel>

              <Select
                multiple
                value={visibleColumns}
                onChange={handleColumnChange}
                input={<OutlinedInput label="Columns" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((v) => (
                      <Chip
                        key={v}
                        label={v}
                        size="small"
                        color={DEFAULT_FIELD_KEYS.includes(v) ? "primary" : "default"}
                      />
                    ))}
                  </Box>
                )}
              >
                {/* Default columns (disabled) */}
                {DEFAULT_FIELD_KEYS.map((c) => (
                  <MenuItem key={c} value={c} disabled>
                    {c}
                  </MenuItem>
                ))}

                {/* Extra columns */}
                {allFields
                  .filter((f) => !DEFAULT_FIELD_KEYS.includes(f))
                  .map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* DataGrid */}
      <Box className="projects-page-grid" sx={{ height: 680, width: "100%" }}>
        <DataGrid
          sx={{
            "& .MuiDataGrid-row:hover": {
              transform: "scale(1.01)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
              backgroundColor: "#fff",
              zIndex: 2,
              position: "relative",
              transition: "all 0.2s ease",
              cursor: "pointer",
            },
            "& .MuiDataGrid-columnHeaders": { minHeight: 100, maxHeight: 100 },
            "& .MuiDataGrid-columnHeader": {
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              paddingTop: "8px",
              paddingBottom: "8px",
              whiteSpace: "normal",
              textAlign: "left",
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
          getRowId={(r) => r._id || r.id}
          disableRowSelectionOnClick
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          onRowClick={(params) => { navigate(`/projects/${params.row._id}`); }}
        />
      </Box>

      {/* SETTINGS DRAWER */}
      <ProjectSettings
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        settings={settings}
        updateSettings={updateSettings}
        allFields={allFields}
        defaultFields={DEFAULT_FIELD_KEYS}
      />
    </Box>
  );
}
