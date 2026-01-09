import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import {
  generateMonths,
  prorateUnits,
  calculateMonthlySavings,
} from "./financialUtils";

const API = process.env.REACT_APP_API_BASE;

const VolumeBasedSavings = ({ block, startDate, onChange, onRemove }) => {
  const months = generateMonths(startDate);

  const [platformOptions, setPlatformOptions] = useState([]);
  const [monthlyUnits, setMonthlyUnits] = useState({});

  /* Load platforms */
useEffect(() => {
  if (!block.functionalGroup) {
    setPlatformOptions([]);
    return;
  }

  axios
    .get(`${API}/api/financial/platforms`, {
      params: { functionalGroupId: block.functionalGroup },
    })
    .then((res) => {
      setPlatformOptions(res.data.platforms || []);
    })
    .catch((err) => {
      console.error("Platform load failed", err);
      setPlatformOptions([]);
    });
}, [block.functionalGroup]);



  /* Load monthly units */
  useEffect(() => {
    if (!block.platformId) {
      setMonthlyUnits({});
      return;
    }

    axios
      .get(`${API}/api/financial/platform-monthly`, {
        params: { platformId: block.platformId },
      })
      .then((res) => setMonthlyUnits(res.data.months || {}))
      .catch(() => setMonthlyUnits({}));
  }, [block.platformId]);

  /* Calculate savings */
  useEffect(() => {
    let annualized = 0;
    let totalVolume = 0;
    const monthlySavings = {};

    months.forEach((m) => {
      const ym = m.format("YYYY-MM");
      const units = prorateUnits(monthlyUnits[ym] || 0, m, startDate);
      const savings = calculateMonthlySavings(units, block.unitCostSavings);

      monthlySavings[ym] = savings;
      annualized += savings;
      totalVolume += units;
    });

    onChange({
      ...block,
      monthlySavings,
      annualizedSavings: annualized,
      totalVolume,
    });
  }, [monthlyUnits, block.unitCostSavings, months, startDate]);

  return (
    <Box border="1px solid #ccc" borderRadius={1} mb={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        px={2}
        py={1}
        bgcolor="#1b2a5b"
      >
        <Typography color="white">Volume Based Savings</Typography>
        <IconButton onClick={onRemove} size="small">
          <CloseIcon sx={{ color: "#fff" }} />
        </IconButton>
      </Box>

      <Box p={2} display="flex" gap={3} alignItems="center" flexWrap="wrap">
        <FormControl sx={{ minWidth: 240 }}>
          <InputLabel>Platform</InputLabel>
          <Select
            label="Platform"
            value={block.platformId}
            disabled={!block.functionalGroup}
            onChange={(e) =>
            onChange({ ...block, platformId: e.target.value })
            }
          >
            {platformOptions.map((p) => (
              <MenuItem key={p.platformId} value={p.platformId}>
                {p.platformName}
              </MenuItem>
            ))}
            {platformOptions.length === 0 && (
              <MenuItem disabled>No platforms available</MenuItem>
            )}
          </Select>
        </FormControl>

        <TextField
          label="Unit Cost Savings ($)"
          type="text"
          inputMode="decimal"
          value={block.unitCostSavings}
          onChange={(e) =>
            onChange({
              ...block,
              unitCostSavings: Number(
                e.target.value.replace(/[^0-9.]/g, "")
              ),
            })
          }
          sx={{ width: 220 }}
        />

        <Typography>
          <strong>Annualized:</strong>{" "}
          ${block.annualizedSavings.toLocaleString()}
        </Typography>

        <Typography>
          <strong>Total Volume:</strong>{" "}
          {block.totalVolume.toLocaleString()} units
        </Typography>
      </Box>
      {/* Monthly Savings Buckets */}
<Box
  sx={{
    display: "grid",
    gridAutoFlow: "column",
    gridAutoColumns: "max-content",
    gap: 1,
    px: 2,
    pb: 2,
  }}
>
  {months.map((m) => {
    const ym = m.format("YYYY-MM");

    return (
      <Box
        key={ym}
        sx={{
          border: "1px solid #ddd",
          borderRadius: 1,
          px: 1.25,
          py: 1,
          minWidth: 80,
          textAlign: "center",
          backgroundColor: "#fafafa",
        }}
      >
        <Typography fontWeight={700} fontSize={12}>
          {m.format("MMM YYYY")}
        </Typography>

        <Typography fontWeight={700} fontSize={12}>
          $
          {Number(block.monthlySavings?.[ym] || 0).toFixed(2)}
        </Typography>
      </Box>
    );
  })}
</Box>

    </Box>
  );
};

export default VolumeBasedSavings;
