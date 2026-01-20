// src/utils/changeDiff.js
export function computeChanges(baseline, current, valueResolver) {
  if (!baseline) return [];

  const changes = [];
  // const FINANCIAL_DIFF_FIELDS = {
  //   PLATFORM_UNIT_COST: "unit_cost",
  // };

  const isLabelField = (key) => key.endsWith("__label");


  const IGNORED_METADATA_FIELDS = new Set([
    "_lookupCache",
    "financial",
    "documents",
    "documentsDraft",
    "projectNumber", // ✅ ADD THIS
    "createdOn",
    "createdBy",
    "modifiedOn",
    "modifiedBy",
    "supplierName",
  ]);



  /* ---------- METADATA ---------- */
  Object.keys(current.metadata || {}).forEach((key) => {
    if (IGNORED_METADATA_FIELDS.has(key)) return;

    // 🔥 CRITICAL: ignore UI label helpers
    if (isLabelField(key)) return;

    const DERIVED_FIELDS = new Set([
      "Estimated_Annualized_Savings",
      "Weighted_Unit_Cost_Savings",
      "annualized",
      "weightedUnitCost",
      "yearly",
    ]);
    if (DERIVED_FIELDS.has(key)) return;


    const oldVal = baseline.metadata?.[key];
    const newVal = current.metadata?.[key];

    const isSameRaw =
      String(oldVal ?? "") === String(newVal ?? "");

    if (isSameRaw) return;

    changes.push({
      section: "Metadata",
      field: key,
      oldValue: valueResolver(key, oldVal),
      newValue: valueResolver(key, newVal),
    });
  });

  // FINANCIAL — USER EDITABLE ONLY
  const oldPlatforms = baseline.financial?.platforms || [];
  const newPlatforms = current.financial?.platforms || [];


  newPlatforms.forEach((p) => {
    const stringify = (v) =>
      typeof v === "object" ? JSON.stringify(v, null, 2) : v;
    const old = oldPlatforms.find(op => op._id === p._id);
    if (!old) return;

    if (old.platform_ref_id !== p.platform_ref_id) {
      changes.push({
        section: "Financial",
        field: "Platform",
        oldValue: stringify(oldPlatforms),
        newValue: stringify(newPlatforms),
      });
    }
    if (old.unit_cost !== p.unit_cost) {
      changes.push({
        section: "Financial",
        field: "Unit Cost Savings",
        oldValue: old.unit_cost,
        newValue: p.unit_cost,
      });
    }
  });

  /* ---------- FIXED COST SAVINGS ---------- */
  const oldFixed = baseline.financial?.fixedCostSavings || [];
  const newFixed = current.financial?.fixedCostSavings || [];

  newFixed.forEach((f) => {
    const old = oldFixed.find((of) => of._id === f._id);
    if (!old) return; // New items not tracked as diffs in this simplified logic, or could be added

    // Compare savings
    // Ensure we handle string/number comparison safely
    const oldSavings = Number(old.savings || 0);
    const newSavings = Number(f.savings || 0);

    if (oldSavings !== newSavings) {
      // Format month for display if available
      const monthLabel = f.month ? new Date(f.month).toLocaleString('default', { month: 'short', year: 'numeric' }) : "Fixed Cost";

      changes.push({
        section: "Financial",
        field: `Fixed Cost (${monthLabel})`,
        oldValue: oldSavings,
        newValue: newSavings,
      });
    }
  });


  return changes;
}
