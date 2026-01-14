// src/utils/changeDiff.js
export function computeChanges(baseline, current, valueResolver) {
  if (!baseline) return [];

  const changes = [];
  const FINANCIAL_DIFF_FIELDS = {
    PLATFORM_UNIT_COST: "unit_cost",
  };

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


  return changes;
}
