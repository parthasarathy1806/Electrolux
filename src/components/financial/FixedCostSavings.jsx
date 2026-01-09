import React, { useEffect, useState } from "react";
import { Box, TextField, Typography, Popover } from "@mui/material";
import { generateMonths, splitFixedCost } from "./financialUtils";

const FixedCostSavings = ({ startDate, value, onChange, mode }) => {
  const months = generateMonths(startDate);

  const [editingMonth, setEditingMonth] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  /* AUTO mode – distribute from annualized total */
  useEffect(() => {
    if (value.mode === "MANUAL") return;

    const monthly = splitFixedCost(
      value.annualizedTotal,
      months,
      startDate
    );

    onChange({ ...value, monthly });
  }, [value.annualizedTotal, startDate]);

  /* Open popup editor */
  const handleOpenEditor = (event, ym) => {
    setAnchorEl(event.currentTarget);
    setEditingMonth(ym);
  };

  /* Close popup editor */
  const handleCloseEditor = () => {
    setAnchorEl(null);
    setEditingMonth(null);
  };

  return (
    <Box mt={4}>
      <Typography variant="h6">Fixed Cost Savings</Typography>

      {/* Annualized input */}
      <TextField
        label="Enter Annualized Total ($)"
        disabled={mode === "details"} 
        type="text"
        inputMode="decimal"
        pattern="[0-9]*"
        value={value.annualizedTotal || ""}
        onChange={(e) =>
          onChange({
            ...value,
            annualizedTotal: Number(e.target.value.replace(/[^0-9.]/g, "")),
            mode: "AUTO",
          })
        }
        sx={{ width: 300, my: 2 }}
      />

      {/* Monthly buckets */}
      <Box
        sx={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "max-content",
          gap: 1,
        }}
      >
        {months.map((m) => {
          const ym = m.format("YYYY-MM");

          return (
            <Box
              key={ym}
              onClick={(e) => handleOpenEditor(e, ym)}
              sx={{
                border: "1px solid #ddd",
                borderRadius: 1,
                px: 1.25,
                py: 1,
                minWidth: 75,
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: "#fafafa",
              }}
            >
              <Typography fontWeight={700} fontSize={12}>
                {m.format("MMMYYYY")}
              </Typography>

              <Typography fontWeight={700} fontSize={12}>
                ${Number(value.monthly?.[ym] || 0).toFixed(2)}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Floating popup editor */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseEditor}
        anchorOrigin={{
          vertical: "center",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "center",
        }}
      >
        {editingMonth && (
          <Box p={2} width={160}>
            <TextField
              autoFocus
              fullWidth
              type="text"
              inputMode="decimal"
              pattern="[0-9]*"
              size="small"
              label="Amount ($)"
              value={value.monthly?.[editingMonth] ?? ""}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                const updatedMonthly = {
                  ...value.monthly,
                  [editingMonth]: Number(cleaned) || 0,
                };

                const newTotal = Object.values(updatedMonthly).reduce(
                  (sum, v) => sum + (Number(v) || 0),
                  0
                );

                onChange({
                  ...value,
                  monthly: updatedMonthly,
                  annualizedTotal: newTotal,
                  mode: "MANUAL",
                });
              }}
              onBlur={handleCloseEditor}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCloseEditor();
                }
              }}
              inputProps={{ step: "0.01" }}
            />
          </Box>
        )}
      </Popover>
    </Box>
  );
};

export default FixedCostSavings;
