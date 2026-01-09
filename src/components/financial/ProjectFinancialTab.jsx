import React, { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import VolumeBasedSavings from "./VolumeBasedSavings";
import FixedCostSavings from "./FixedCostSavings";
import FinancialSummary from "./FinancialSummary";
import { sumByYear } from "./financialUtils";

const ProjectFinancialTab = ({ formData, setFormData, mode = "create" }) => {
  const startDate = formData.startDate;

  const [volumeBlocks, setVolumeBlocks] = useState([]);
  const [fixedCost, setFixedCost] = useState({
    annualizedTotal: 0,
    monthly: {},
    mode: "MANUAL",
  });

  const [initialized, setInitialized] = useState(false);

  /* ------------------------------------------------------
     🔹 Hydrate ONLY ONCE (Edit / Details mode)
  ------------------------------------------------------ */
  useEffect(() => {
    if (!formData.financial) return;
    if (mode === "create") return;
    if (initialized) return;

    setVolumeBlocks(
      (formData.financial.volumeBased || []).map((p) => ({
        id: p.id || crypto.randomUUID(),
        functionalGroup: formData.functionGroup,
        platformId: p.platformId || "",
        unitCostSavings: p.unitCostSavings || 0,
        monthlySavings: p.monthlySavings || {},
        annualizedSavings: p.annualizedSavings || 0,
        totalVolume: p.totalVolume || 0,
      }))
    );

    setFixedCost({
      annualizedTotal: formData.financial.fixedCost?.annualizedTotal || 0,
      monthly: formData.financial.fixedCost?.monthly || {},
      mode: formData.financial.fixedCost?.mode || "MANUAL",
    });

    setInitialized(true);
  }, [formData.financial, mode, initialized, formData.functionGroup]);

  /* ------------------------------------------------------
     🔹 Add Volume Block
  ------------------------------------------------------ */
  const addVolumeBlock = () => {
    setVolumeBlocks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        functionalGroup: formData.functionGroup,
        platformId: "",
        unitCostSavings: 0,
        monthlySavings: {},
        annualizedSavings: 0,
        totalVolume: 0,
      },
    ]);
  };

  /* ------------------------------------------------------
     🔹 Totals Calculation
  ------------------------------------------------------ */
  const totals = useMemo(() => {
    const volumeAnnualized = volumeBlocks.reduce(
      (sum, b) => sum + (b.annualizedSavings || 0),
      0
    );

    const totalVolume = volumeBlocks.reduce(
      (sum, b) => sum + (b.totalVolume || 0),
      0
    );

    const annualized = volumeAnnualized + fixedCost.annualizedTotal;

    const weightedUnitCost =
      totalVolume > 0 ? volumeAnnualized / totalVolume : 0;

    const yearly = sumByYear({
      ...fixedCost.monthly,
      ...volumeBlocks.reduce(
        (acc, b) => ({ ...acc, ...b.monthlySavings }),
        {}
      ),
    });

    return {
      annualized,
      yearly,
      volumeAnnualized,
      totalVolume,
      weightedUnitCost,
    };
  }, [volumeBlocks, fixedCost]);

  /* ------------------------------------------------------
     🔹 Sync back to formData
  ------------------------------------------------------ */
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      financial: {
        volumeBased: volumeBlocks,
        fixedCost,
        totals,
      },
      Estimated_Annualized_Savings: totals.annualized,
      Weighted_Unit_Cost_Savings: totals.weightedUnitCost,
    }));
  }, [volumeBlocks, fixedCost, totals, setFormData]);

  return (
    <Box>
      <FinancialSummary
        startDate={startDate}
        totals={totals}
        onAddVolumeBlock={addVolumeBlock}
      />

      {volumeBlocks.map((block) => (
        <VolumeBasedSavings
          key={block.id}
          block={block}
          startDate={startDate}
          onChange={(updated) =>
            setVolumeBlocks((prev) =>
              prev.map((b) => (b.id === updated.id ? updated : b))
            )
          }
          onRemove={() =>
            setVolumeBlocks((prev) =>
              prev.filter((b) => b.id !== block.id)
            )
          }
        />
      ))}

      <FixedCostSavings
        startDate={startDate}
        value={fixedCost}
        onChange={setFixedCost}
      />
    </Box>
  );
};

export default ProjectFinancialTab;
