// backend/controllers/financialController.js
import { client, dbName } from "./mongoController.js";
import dayjs from "dayjs";

/**
 * GET /api/financial/platforms?functionalGroupId=xxx
 */
export const getFinancialPlatforms = async (req, res) => {
  const { functionalGroupId } = req.query;

  if (!functionalGroupId) {
    return res.status(400).json({
      error: "functionalGroupId is required",
    });
  }

  try {
    await client.connect();
    const db = client.db(dbName);

    /* -------------------------------------------
       1️⃣ FG → PSI (decides DIRECT vs COMMON)
    -------------------------------------------- */
    const psiMappings = await db
      .collection("fg_to_psi_group_direct_platforms")
      .find({ functionGrpId: functionalGroupId.toString() })
      .toArray();

    const isDirect = psiMappings.length > 0;
    let platforms = [];

    /* -------------------------------------------
       2️⃣ Fetch platforms
    -------------------------------------------- */
    if (isDirect) {
  const psiGroups = psiMappings
    .map((m) => m.psi_Groups)
    .filter((v) => v !== undefined && v !== null);

  platforms = await db
    .collection("platformVolume_direct")
    .find({ psiGroup: { $in: psiGroups } })
    .toArray();
}
 else {
      platforms = await db
        .collection("platformVolume_Common")
        .find({ functionalGroup: functionalGroupId.toString() })
        .toArray();
    }

    /* -------------------------------------------
       3️⃣ Dropdown response
    -------------------------------------------- */
    const response = platforms.map((p) => ({
      platformId: p._id.toString(),
      platformName: p.platform || p.platformName,
      platformCategory: isDirect ? "DIRECT" : "COMMON",
    }));

    res.json({ platforms: response });
  } catch (err) {
    console.error("❌ Financial platforms error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/financial/platform-monthly?platformId=xxx
 */
export const getPlatformMonthlySavings = async (req, res) => {
  const { platformId } = req.query;

  if (!platformId) {
    return res.status(400).json({
      error: "platformId is required",
    });
  }

  try {
    await client.connect();
    const db = client.db(dbName);

    const rows = await db
      .collection("platform_monthly_savings_all_types")
      .find({ platform_id: platformId.toString() })
      .toArray();

    const monthly = {};
    rows.forEach((r) => {
      const ym = dayjs(r.month).format("YYYY-MM");
      monthly[ym] = r.savings;
    });

    res.json({ months: monthly });
  } catch (err) {
    console.error("❌ Platform monthly error:", err);
    res.status(500).json({ error: err.message });
  }
};
