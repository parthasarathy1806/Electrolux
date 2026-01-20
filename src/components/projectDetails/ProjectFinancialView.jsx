// src/components/projectDetails/ProjectFinancialView.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Popover,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
// import AddIcon from "@mui/icons-material/Add";
import axios from "axios";
import dayjs from "dayjs";

import FinancialSummary from "../financial/FinancialSummary";

import {
  generateMonths,
  prorateUnits,
  calculateMonthlySavings,
  sumByYear,
} from "../financial/financialUtils";

const API = process.env.REACT_APP_API_BASE;

const ProjectFinancialView = ({ financial, metadata, onFinancialChange, onTotalsChange, onPlatformLookups, mode = "details" }) => {
  const startDate = metadata?.startDate;
  const functionalGroup = metadata?.functionGroup;
  const isLegacy = metadata?.source === "legacy";

  /* ---------------- STATE ---------------- */
  const [platforms, setPlatforms] = useState([]);
  const [fixedCost, setFixedCost] = useState([]);
  const [platformOptions, setPlatformOptions] = useState([]);

  const [editingMonth, setEditingMonth] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    setPlatforms(financial?.platforms || []);

    if (!financial?.fixedCostSavings || !startDate) {
      setFixedCost([]);
      return;
    }

    // ✅ LEGACY: limit months to startDate + 12 months
    if (isLegacy) {
      const allMonths = generateMonths(startDate);
      const startMonth = dayjs(startDate).startOf("month");

      const allowedMonths = allMonths
        .filter(m => m.isSame(startMonth) || m.isAfter(startMonth))
        .slice(0, 13);

      const allowedKeys = new Set(
        allowedMonths.map(m => m.format("YYYY-MM"))
      );

      const filtered = financial.fixedCostSavings.filter(f =>
        allowedKeys.has(dayjs(f.month).format("YYYY-MM"))
      );

      setFixedCost(filtered);
    } else {
      // 🟢 NEW PROJECTS – untouched
      setFixedCost(financial.fixedCostSavings);
    }
  }, [financial, startDate, isLegacy]);


  /* ---------------- LOAD PLATFORM OPTIONS ---------------- */
  useEffect(() => {
    if (!functionalGroup) return;

    axios
      .get(`${API}/api/financial/platforms`, {
        params: { functionalGroupId: functionalGroup },
      })
      .then((res) => {
        const platforms = res.data.platforms || [];
        setPlatformOptions(platforms);
        onPlatformLookups?.(platforms); // ✅ NEW
      })
      .catch(() => setPlatformOptions([]));
  }, [functionalGroup, onPlatformLookups]);

  const platformRefIds = platforms.map(p => p.platform_ref_id).join(",");

  useEffect(() => {
    async function loadPlatformVolumes() {
      const updated = await Promise.all(
        platforms.map(async (p) => {
          if (!p.platform_ref_id) return p;

          try {
            const res = await axios.get(
              `${API}/api/financial/platform-monthly`,
              { params: { platformId: p.platform_ref_id } }
            );

            const monthly = res.data.months || {};
            const totalVolume = Object.values(monthly).reduce(
              (s, v) => s + (Number(v) || 0),
              0
            );

            return {
              ...p,
              monthlyUnits: monthly,
              total_volume: totalVolume,
            };
          } catch (e) {
            console.error("Volume load failed", e);
            return p;
          }
        })
      );

      setPlatforms(updated);
    }

    loadPlatformVolumes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformRefIds]);

  /* ---------------- PLATFORM CRUD (UNCHANGED) ---------------- */
  const addPlatform = () => {
    const tempId = `temp-${Date.now()}`;

    setPlatforms(prev => [
      ...prev,
      {
        _id: tempId,
        platform_ref_id: "",
        unit_cost: 0,
        total_volume: 0,
        annualized_savings: 0,
      }
    ]);

    onFinancialChange?.(prev => ({
      ...prev,
      platforms: [
        ...(prev.platforms || []),
        {
          _id: tempId,
          platform_ref_id: "",
          unit_cost: 0,
          total_volume: 0,
          annualized_savings: 0,
        },
      ],
    }));
  };


  const updatePlatform = async (row, updates) => {
    const updated = { ...row, ...updates };

    setPlatforms((prev) =>
      prev.map((p) => (p._id === row._id ? updated : p))
    );

    // 🔑 notify parent
    onFinancialChange?.(prev => ({
      ...prev,
      platforms: prev.platforms.map(p =>
        p._id === row._id ? updated : p
      ),
    }));

    if (mode !== "details") {
      await axios.put(
        `${API}/api/mongo/data/project_platforms/${row._id}`,
        updated
      );
    }
  };

  const deletePlatform = async (id) => {
    // UI-only row (not yet saved)
    if (!id || id.startsWith("temp")) {
      setPlatforms((prev) => prev.filter((p) => p._id !== id));
      return;
    }

    try {

      setPlatforms((prev) => prev.filter((p) => p._id !== id));
      onFinancialChange?.(prev => ({
        ...prev,
        platforms: prev.platforms.filter(p => p._id !== id),
      }));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };


  /* ---------------- FIXED COST ---------------- */
  const openEditor = (e, month, row) => {
    setEditingMonth({ month, id: row._id });
    setAnchorEl(e.currentTarget);
  };

  const closeEditor = () => {
    setEditingMonth(null);
    setAnchorEl(null);
  };


  const handleLocalCostChange = (id, value) => {
    setFixedCost((prev) =>
      prev.map((f) =>
        f._id === id ? { ...f, savings: value } : f
      )
    );
  };

  const saveFixedCost = async () => {
    if (!editingMonth) return;

    const rowId = editingMonth.id;
    const row = fixedCost.find(f => f._id === rowId);
    if (!row) return;

    const numericValue = Number(row.savings) || 0;

    // Flush to parent
    onFinancialChange?.(prev => ({
      ...prev,
      fixedCostSavings: prev.fixedCostSavings.map(f =>
        f._id === rowId ? { ...f, savings: numericValue } : f
      ),
    }));

    if (mode !== "details") {
      try {
        await axios.put(
          `${API}/api/mongo/data/project_fixed_cost_savings/${rowId}`,
          { savings: numericValue }
        );
      } catch (e) {
        console.error("Failed to save fixed cost", e);
      }
    }

    // Close editor
    setEditingMonth(null);
    setAnchorEl(null);
  };


  /* ---------------- 🔑 COMPUTATIONS (CREATE-PAGE LOGIC) ---------------- */
  const computed = useMemo(() => {
    if (!startDate) {
      return {
        platforms: [],
        totals: {
          weightedUnitCost: 0,
          annualized: 0,
          totalVolume: 0,
          yearly: {},
        },
      };
    }

    const months = generateMonths(startDate);

    let totalVolume = 0;
    let annualized = 0;
    const yearlyMap = {};

    const enrichedPlatforms = platforms.map((p) => {
      let pAnnualized = 0;
      let pVolume = 0;
      const monthlySavings = {};

      // ✅ LEGACY PLATFORM HANDLING
      if (isLegacy && !p.platform_ref_id) {
        const months = generateMonths(startDate).slice(0, 13);
        const monthlyVolume = p.total_volume / months.length;

        months.forEach((m) => {
          const ym = m.format("YYYY-MM");
          const savings = calculateMonthlySavings(
            monthlyVolume,
            p.unit_cost
          );

          monthlySavings[ym] = savings;
          pAnnualized += savings;
          pVolume += monthlyVolume;

          yearlyMap[ym] = (yearlyMap[ym] || 0) + savings;
        });
      } else {
        // 🟢 EXISTING LOGIC (new projects)
        months.forEach((m) => {
          const ym = m.format("YYYY-MM");

          const units = prorateUnits(
            p.total_volume / months.length,
            m,
            startDate
          );

          const savings = calculateMonthlySavings(units, p.unit_cost);

          monthlySavings[ym] = savings;
          pAnnualized += savings;
          pVolume += units;

          yearlyMap[ym] = (yearlyMap[ym] || 0) + savings;
        });
      }
      totalVolume += pVolume;
      annualized += pAnnualized;

      return {
        ...p,
        monthlySavings,
        annualizedSavings: pAnnualized,
        computedVolume: pVolume,
      };
    });

    // 🔑 ADD FIXED COST TO TOTALS
    fixedCost.forEach((f) => {
      const val = Number(f.savings) || 0;
      annualized += val;

      if (f.month) {
        const ym = dayjs(f.month).format("YYYY-MM");
        yearlyMap[ym] = (yearlyMap[ym] || 0) + val;
      }
    });


    return {
      platforms: enrichedPlatforms,
      totals: {
        weightedUnitCost:
          totalVolume > 0 ? annualized / totalVolume : 0,
        annualized,
        totalVolume,
        yearly: sumByYear(yearlyMap),
      },
    };

  }, [platforms, fixedCost, startDate, isLegacy]);
  useEffect(() => {
    onTotalsChange?.(computed.totals);
  }, [computed.totals, onTotalsChange]);

  if (!startDate) {
    return (
      <Typography color="text.secondary">
        Financial data not available.
      </Typography>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <Box>
      {/* 🔑 SAME TOP BAR AS CREATE PAGE */}
      <FinancialSummary
        startDate={startDate}
        totals={computed.totals}
        onAddVolumeBlock={addPlatform}
      />

      {/* PLATFORM BLOCKS */}
      {computed.platforms.map((p) => (
        <Box key={p._id} border="1px solid #ccc" borderRadius={1} mb={3}>
          <Box
            display="flex"
            justifyContent="space-between"
            px={2}
            py={1}
            bgcolor="#1b2a5b"
          >
            <Typography color="white">
              Volume Based Savings
            </Typography>
            <IconButton onClick={() => deletePlatform(p._id)}>
              <CloseIcon sx={{ color: "#fff" }} />
            </IconButton>
          </Box>

          <Box p={2} display="flex" gap={3} flexWrap="wrap">
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Platform</InputLabel>
              <Select
                value={p.platform_ref_id || ""}
                disabled={false}
                label="Platform"
                onChange={(e) =>
                  updatePlatform(p, { platform_ref_id: e.target.value })
                }
              >
                {platformOptions.map((opt) => (
                  <MenuItem key={opt.platformId} value={opt.platformId}>
                    {opt.platformName}
                  </MenuItem>
                ))}
              </Select>

            </FormControl>

            <TextField
              label="Unit Cost Savings ($)"
              value={p.unit_cost}
              onChange={(e) =>
                updatePlatform(p, {
                  unit_cost: Number(
                    e.target.value.replace(/[^0-9.]/g, "")
                  ),
                })
              }
              sx={{ width: 220 }}
            />

            <Typography>
              <strong>Annualized:</strong>{" "}
              ${p.annualizedSavings.toLocaleString()}
            </Typography>

            <Typography>
              <strong>Total Volume:</strong>{" "}
              {p.computedVolume.toLocaleString()} units
            </Typography>
          </Box>

          {/* 🔑 MONTHLY BUCKETS – READ ONLY */}
          <Box
            px={2}
            pb={2}
            sx={{
              display: "grid",
              gridAutoFlow: "column",
              gridAutoColumns: "max-content",
              gap: 1,
              overflowX: "auto",
            }}
          >
            {generateMonths(startDate).map((m) => {
              const ym = m.format("YYYY-MM");
              const savings = p.monthlySavings[ym] || 0;
              const units =
                p.unit_cost > 0 ? savings / p.unit_cost : 0;

              return (
                <Box
                  key={ym}
                  sx={{
                    border: "1px solid #ddd",
                    borderRadius: 1,
                    px: 1.25,
                    py: 0.75,
                    minWidth: 85,
                    textAlign: "center",
                    backgroundColor: "#fafafa",
                  }}
                >
                  <Typography fontWeight={700} fontSize={12}>
                    {m.format("MMM YYYY")}
                  </Typography>

                  <Typography fontWeight={700} fontSize={12}>
                    ${savings.toLocaleString()}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontSize={11}
                  >
                    {units.toFixed(2)} units
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      ))}

      {/* FIXED COST (UNCHANGED) */}
      <Box mt={4}>
        <Typography variant="h6">Fixed Cost Savings</Typography>

        <Box
          sx={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "max-content",
            gap: 1,
            mt: 2,
          }}
        >
          {fixedCost.map((f) => (
            <Box
              key={f._id}
              onClick={(e) =>
                openEditor(e, dayjs(f.month).format("YYYY-MM"), f)
              }
              sx={{
                border: "1px solid #ddd",
                borderRadius: 1,
                px: 1.25,
                py: 1,
                minWidth: 80,
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: "#fafafa",
              }}
            >
              <Typography fontWeight={700} fontSize={12}>
                {dayjs(f.month).format("MMM YYYY")}
              </Typography>
              <Typography fontWeight={700} fontSize={12}>
                ${Number(f.savings).toFixed(2)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* FIXED COST EDITOR */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closeEditor}
      >
        {editingMonth && (() => {
          const row = fixedCost.find(f => f._id === editingMonth.id);
          if (!row) return null;

          return (
            <Box p={2} width={160}>
              <TextField
                autoFocus
                fullWidth
                label="Amount ($)"
                value={row.savings}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*\.?\d{0,2}$/.test(val)) {
                    handleLocalCostChange(row._id, val);
                  }
                }}
                onBlur={saveFixedCost}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.target.blur(); // Triggers saveFixedCost
                  }
                }}
              />
            </Box>
          );
        })()}
      </Popover>
    </Box>
  );
};

export default ProjectFinancialView;
