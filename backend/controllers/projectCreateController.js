// backend/controllers/projectCreateController.js
import { ObjectId } from "mongodb";
import { client, dbName } from "./mongoController.js";
import { getNextSequence } from "../utils/getNextSequence.js";

async function getNextProjectNumber(db) {
  const last = await db
    .collection("projects")
    .find({ projectNumber: { $exists: true } })
    .sort({ projectNumber: -1 })
    .limit(1)
    .toArray();

  if (!last.length) {
    return 2447304; // starting base
  }

  return Number(last[0].projectNumber) + 1;
}

/**
 * POST /api/projects/create
 * Creates project across 4 collections using transaction
 */
export const createProject = async (req, res) => {
  const session = client.startSession();

  try {
    const {
      metadata,
      financial,
      documents = [],
    } = req.body;

    if (!metadata?.projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }

    await client.connect();
    const db = client.db(dbName);

    session.startTransaction();

  
 
    /* -------------------------------------------------
       1️⃣ INSERT → projects (MAIN METADATA)
    ------------------------------------------------- */
    const nextProjectNumber = await getNextProjectNumber(db);
    const projectDoc = {
      ...metadata,
      projectNumber: nextProjectNumber,
      createdBy: "admin",
      createdOn: new Date(),
    };

    const projectResult = await db
      .collection("projects")
      .insertOne(projectDoc, { session });

    const projectRefId = projectResult.insertedId.toString();

    /* -------------------------------------------------
       2️⃣ INSERT → project_fixed_cost_savings
    ------------------------------------------------- */
    const fixedMonthly = financial?.fixedCost?.monthly || {};
    const fixedRows = Object.entries(fixedMonthly).map(
      ([ym, savings]) => ({
        project_ref_id: projectRefId,
        month: new Date(`${ym}-01T00:00:00Z`),
        savings: Number(savings) || 0,
      })
    );

    if (fixedRows.length) {
      await db
        .collection("project_fixed_cost_savings")
        .insertMany(fixedRows, { session });
    }

    /* -------------------------------------------------
       3️⃣ INSERT → project_platforms
    ------------------------------------------------- */
    const platformRows = (financial?.volumeBased || []).map((b) => ({
      project_ref_id: projectRefId,
      platform_ref_id: b.platformId,
      unit_cost: Number(b.unitCostSavings) || 0,
      annualized_savings: Number(b.annualizedSavings) || 0,
      total_volume: Number(b.totalVolume) || 0,
    }));

    if (platformRows.length) {
      await db
        .collection("project_platforms")
        .insertMany(platformRows, { session });
    }

    /* -------------------------------------------------
       4️⃣ INSERT → project_documents
    ------------------------------------------------- */
    const documentRows = documents.map((d) => ({
      project_ref_id: projectRefId,
      doc_type: d.documentType,
      file_name: d.fileName,
      uploaded_by: d.uploadedBy,
      file_ref: d.fileRef || "",
      uploaded_on: new Date(),
    }));

    if (documentRows.length) {
      await db
        .collection("project_documents")
        .insertMany(documentRows, { session });
    }

    /* -------------------------------------------------
       ✅ COMMIT
    ------------------------------------------------- */
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      project_ref_id: projectRefId,
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("❌ Project creation failed:", err);
    res.status(500).json({ error: "Project creation failed" });
  }
};
