import client from "../config/dbClient.js";

export const getProjectChangeRequests = async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: "projectId is required" });
    }

    // 👇 Use native Mongo client
    if (!client.topology?.isConnected()) {
      await client.connect();
    }

    const db = client.db(process.env.MONGO_DB_NAME); // make sure DB_NAME exists in .env

    // 1️⃣ Fetch main change requests
    const mains = await db
      .collection("projectChangeRequestsMain")
      .find({ ProjectID: projectId })
      .sort({ createdOn: -1 })
      .toArray();

    if (!mains.length) {
      return res.json([]);
    }

    // 2️⃣ Collect main IDs as strings
    const mainIds = mains.map((m) => m._id.toString());

    // 3️⃣ Fetch field-level changes
    const fields = await db
      .collection("projectChangeRequestsFieldLevelChanges")
      .find({
        projectChangeRequestRef: { $in: mainIds },
      })
      .toArray();

    // 4️⃣ Group field changes
    const fieldMap = {};
    fields.forEach((f) => {
      const key = f.projectChangeRequestRef;
      if (!fieldMap[key]) fieldMap[key] = [];
      fieldMap[key].push({
        fieldName: f.fieldname,
        originalValue: f.originalValue,
        requestedValue: f.requestedvalue,
        annualImpact: f.anuunalImpact ?? 0,
        year1Impact: f.year1Impact ?? 0,
        year2Impact: f.year2Impact ?? 0,
        reasonCode: f.reasonCode,
        commentCode: f.commentCode,
      });
    });

    // 5️⃣ Final response
    const response = mains.map((m) => ({
      changeRequestId: m._id.toString(),
      projectId: m.ProjectID,
      status: m.Status,
      createdOn: m.createdOn,
      approvedOn: m.approvedOn,
      reasonCode: m.reasonCode,
      commentCode: m.commentCode,
      impact: {
        annualized: m.anuunalImpact ?? 0,
        year1: m.year1Impact ?? 0,
        year2: m.year2Impact ?? 0,
      },
      fields: fieldMap[m._id.toString()] || [],
    }));

    res.json(response);
  } catch (err) {
    console.error("❌ Failed to fetch change requests:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


import { ObjectId } from "mongodb";

/* -------------------------------------------------------------------------- */
/*  CREATE CHANGE REQUEST (SUBMIT FROM REVIEW TAB)                             */
/* -------------------------------------------------------------------------- */
export const createProjectChangeRequest = async (req, res) => {
  try {
    const {
      projectId,
      projectDesc,
      reasonCode,
      commentCode,
      totals,
      changes,
      metadata,
      userId = "system", // later replace with auth user
    } = req.body;

    if (!projectId || !changes?.length) {
      return res.status(400).json({ message: "Invalid change request payload" });
    }

    if (!client.topology?.isConnected()) {
      await client.connect();
    }

    const db = client.db(process.env.MONGO_DB_NAME);

    /* -------------------- 1️⃣ INSERT MAIN -------------------- */
    const mainDoc = {
      ProjectID: projectId,
      projectDesc: projectDesc || "",
      Status: "SUBMITTED", // ⛔ approval later
      reasonCode,
      commentCode,

      anuunalImpact: totals?.annualized || 0,
      year1Impact: totals?.year1 || 0,
      year2Impact: totals?.year2 || 0,

      createdOn: new Date(),
      approvedOn: null,

      createdBy: userId,
      updatedBy: userId,
      version: Date.now(),
    };

    const mainResult = await db
      .collection("projectChangeRequestsMain")
      .insertOne(mainDoc);

    const changeRequestId = mainResult.insertedId.toString();

    /* -------------------- 2️⃣ INSERT FIELD LEVEL -------------------- */
    const fieldDocs = changes.map((c) => ({
      fieldname: c.field,
      originalValue: c.oldValue,
      requestedvalue: c.newValue,

      fieldStatus: "yes",

      anuunalImpact: c.annualImpact || 0,
      year1Impact: c.year1Impact || 0,
      year2Impact: c.year2Impact || 0,

      reasonCode,
      commentCode,

      projectChangeRequestRef: changeRequestId,
    }));

    if (fieldDocs.length) {
      await db
        .collection("projectChangeRequestsFieldLevelChanges")
        .insertMany(fieldDocs);
    }

    return res.json({
      success: true,
      changeRequestId,
    });
  } catch (err) {
    console.error("❌ Failed to create change request:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
