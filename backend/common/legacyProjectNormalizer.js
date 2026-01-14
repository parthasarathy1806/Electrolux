import { ObjectId } from "mongodb";

/* ----------------------------------
   Risk mapping (code → lookup _id)
---------------------------------- */
const RISK_MAP = {
  A: "57710d0d998edcc80b00002d",
  B: "57710d0d998edcc80b00002e",
  C: "57710d0d998edcc80b00002f",
};

export function normalizeLegacyProject(legacy) {
  return {
    projectId: legacy.ProjectID,
    projectNumber: legacy.projectNumber,
    description: legacy.Project_Description,
    startDate: legacy.Start_Date,

    // ✅ direct ID fields
    functionGroup: legacy.functionGroup,
    location: legacy.PlantID,
    productLine: legacy.plantProductLine,

    projectOwner: legacy.projectOwner,
    purchasingAgent: legacy.purchasingAgent,

    // ✅ mapped enums
    risk: RISK_MAP[legacy.riskStatus] || null,
    status: legacy.Status,
    inPlan: legacy.InPlan === "Y" ? "Yes" : "No",

    // ✅ optional mappings
    activityType: legacy.actType,
    operationsGroup: legacy.sheetType,
    costType: legacy.costType,

    subCommodity: legacy.SubCommodity,
    supplier: legacy.supplierVal,
    idco: legacy.IDCO,

    Estimated_Annualized_Savings:
      legacy.Estimated_Annualized_Savings || 0,
  };
}
export function normalizeLegacyFinancial(legacy) {
  return {
    platforms: (legacy.platforms || []).map((p, idx) => ({
      _id: `legacy-${idx}`,
      platform_ref_id: null,              // ⚠️ UI dropdown safe
      platformName: p.name,               // for display
      unit_cost: p.cost || 0,
      total_volume: legacy.TotalVolumeForDisplay?.[0] || 0,
      annualized_savings: legacy.Estimated_Annualized_Savings || 0,
    })),

    fixedCostSavings: (legacy.Repallmothval || []).map((m) => ({
      month: m.dateval,
      savings: m.savings,
    })),
  };
}
