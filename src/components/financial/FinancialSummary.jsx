import React from "react";
import { Box, Typography, Button } from "@mui/material";
import dayjs from "dayjs";

const KpiItem = ({ value, label }) => (
  <Box textAlign="center" minWidth={140}>
    <Typography fontWeight={700} fontSize={18}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

const FinancialSummary = ({ startDate, totals, onAddVolumeBlock }) => {
  return (
    <Box
      mb={3}
      p={2}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        flexWrap: "wrap",
        borderBottom: "1px solid #e0e0e0",
      }}
    >
      {/* Add New button – LEFT */}
      <Box>
        <Button
          variant="contained"
          size="small"
          onClick={onAddVolumeBlock}
        >
          Add new
        </Button>
      </Box>

      {/* Start Date */}
      <KpiItem
        value={
          startDate
            ? dayjs(startDate).format("MM/DD/YYYY")
            : "-"
        }
        label="Start Date"
      />

      {/* Weighted Unit Cost */}
      <KpiItem
        value={
          totals.totalVolume > 0
            ? `$${totals.weightedUnitCost.toFixed(2)}`
            : "-"
        }
        label="Weighted Unit Cost Savings ($)"
      />

      {/* Annualized Savings */}
      <KpiItem
        value={`$${totals.annualized.toLocaleString()}`}
        label="Annualized Savings ($)"
      />

      {/* Year-wise KPIs */}
      {Object.entries(totals.yearly || {}).map(([year, val]) => (
        <KpiItem
          key={year}
          value={`$${val.toLocaleString()}`}
          label={`${year} ($)`}
        />
      ))}
    </Box>
  );
};

export default FinancialSummary;
