// backend/controllers/mongoController.js
import { GridFSBucket, MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import { mapReferenceFields, collectionLookupMappings } from "../common/mongoMapperCore.js";
dotenv.config({ path: "../.env" });

const client = new MongoClient(process.env.MONGO_URI);
const dbName = process.env.MONGO_DB_NAME;
export { client, dbName };

/* -------------------------------------------------------------------------- */
/* 🔥 Helper: Generate Next Project ID                                        */
/* -------------------------------------------------------------------------- */
const getNextProjectId = async (db, prefix) => {
  const collection = db.collection(getCollectionName("projectCreate"));

  const last = await collection
    .find({ projectId: { $regex: `^${prefix}` } })
    .sort({ projectId: -1 })
    .limit(1)
    .toArray();

  let nextSeq = 1;
  if (last.length && last[0]?.projectId) {
    nextSeq = parseInt(last[0].projectId.slice(-3), 10) + 1;
  }

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
};

/* -------------------------------------------------------------------------- */
/* 🔥 Simple In-Memory Cache with TTL                                         */
/* -------------------------------------------------------------------------- */
const simpleCache = new Map();
function setCache(key, value, ttl = 30 * 1000) {
  const expires = Date.now() + ttl;
  simpleCache.set(key, { value, expires });
}
function getCache(key) {
  const entry = simpleCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    simpleCache.delete(key);
    return null;
  }
  return entry.value;
}

/* -------------------------------------------------------------------------- */
/* 🔥 COLLECTION MAP from env                                                 */
/* -------------------------------------------------------------------------- */
const COLLECTION_MAP = Object.keys(process.env)
  .filter((key) => key.startsWith("COLLECTION_"))
  .reduce((acc, key) => {
    const lookup = key.replace("COLLECTION_", "").toLowerCase();
    acc[lookup] = process.env[key];
    return acc;
  }, {});

const getCollectionName = (lookupName) =>
  COLLECTION_MAP[lookupName?.toLowerCase?.()] || lookupName;

/* -------------------------------------------------------------------------- */
/* 🔥 Format date fields                                                      */
/* -------------------------------------------------------------------------- */
const formatDate = (dateValue) => {
  if (!dateValue) return null;
  try {
    const date = new Date(dateValue);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  } catch {
    return dateValue;
  }
};

/* -------------------------------------------------------------------------- */
/* 1️⃣ GET /api/mongo/data/:lookupName                                       */
/* -------------------------------------------------------------------------- */
export const getMongoData = async (req, res) => {
  const { lookupName } = req.params;

  try {
    await client.connect();
    const db = client.db(dbName);

    /* =========================================================
       PROJECTS TAB → MERGED VIEW (LEGACY + NEW)
    ========================================================= */
    if (lookupName.toLowerCase() === "projectcreate") {
      const legacyCol = db.collection("projectCreate");
      const projectsCol = db.collection("projects");
      const platformsCol = db.collection("project_platforms");

      /* ---------- 1️⃣ LEGACY PROJECTS ---------- */
      const legacy = await legacyCol
        .find({})
        .sort({ _id: -1 })
        .limit(100)
        .toArray();

      const legacyRows = legacy.map((p) => ({
        ...p,
        _id: p._id?.toString(),
        ProjectID: p.ProjectID || p.projectId,
        Project_Description: p.Project_Description || p.description,
        Start_Date: p.Start_Date || p.startDate,
        Estimated_Annualized_Savings:
          p.Estimated_Annualized_Savings ?? 0,
        __source: "LEGACY",
      }));

      /* ---------- 2️⃣ NEW PROJECTS ---------- */
      const sample = await projectsCol.findOne({});
      const createdField =
        Object.keys(sample || {}).find((k) =>
          k.toLowerCase().includes("createdon")
        ) || "_id";

      const projects = await projectsCol
        .find({})
        .sort({ [createdField]: -1 })
        .limit(100)
        .toArray();

      const projectIds = projects.map((p) => p._id.toString());

      /* ---------- 3️⃣ PLATFORM AGGREGATION ---------- */
      const platforms = await platformsCol
        .find({ project_ref_id: { $in: projectIds } })
        .toArray();

      const savingsMap = {};
      platforms.forEach((p) => {
        const pid = p.project_ref_id;
        if (!savingsMap[pid]) savingsMap[pid] = 0;
        savingsMap[pid] += Number(p.annualized_savings || 0);
      });

      const newRows = projects.map((p) => {
        const pid = p._id.toString();

        return {
          ...p,
          _id: pid,
          ProjectID: p.projectId,
          Project_Description: p.description,
          Start_Date: p.startDate,
          Estimated_Annualized_Savings:
            savingsMap[pid] ??
            p.Estimated_Annualized_Savings ??
            0,
          __source: "NEW",
        };
      });

      /* ---------- 4️⃣ MERGE + DEDUPE ---------- */
      const map = new Map();

      legacyRows.forEach((r) => {
        if (r.ProjectID) map.set(r.ProjectID, r);
      });

      newRows.forEach((r) => {
        if (r.ProjectID) map.set(r.ProjectID, r); // NEW overrides legacy
      });

      /* ---------- 5️⃣ SORT + LIMIT ---------- */
      const merged = Array.from(map.values())
        .sort(
          (a, b) =>
            new Date(b.createdOn || b._id) -
            new Date(a.createdOn || a._id)
        )
        .slice(0, 100);

      return res.json(merged);
    }

    /* =========================================================
       DEFAULT LOOKUPS (UNCHANGED)
    ========================================================= */
    const collectionName = getCollectionName(lookupName);
    const collection = db.collection(collectionName);
    let data = await collection.find({}).toArray();

    if (collectionLookupMappings[lookupName?.toLowerCase?.()]) {
      data = await mapReferenceFields(db, data, lookupName);
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching data:", err);
    res.status(500).json({ error: err.message });
  }
};


/* -------------------------------------------------------------------------- */
/* 2️⃣ POST/PUT Add or Update Document                                       */
/* -------------------------------------------------------------------------- */
export const addOrUpdateMongoData = async (req, res) => {
  const { lookupName } = req.params;
  const { _id, ...formData } = req.body;

  try {
    await client.connect();
    const db = client.db(dbName);
    const collectionName = getCollectionName(lookupName);
    const collection = db.collection(collectionName);

    const currentDate = new Date();
    const sampleDoc = await collection.findOne();
    const keys = sampleDoc ? Object.keys(sampleDoc) : [];

    const createdByField = keys.find((f) => f.toLowerCase().includes("createdby")) || "createdBy";
    const modifiedByField = keys.find((f) => f.toLowerCase().includes("modifiedby")) || "modifiedBy";
    const createdOnField = keys.find((f) => f.toLowerCase().includes("createdon")) || "createdOn";
    const modifiedOnField = keys.find((f) => f.toLowerCase().includes("modifiedon")) || "modifiedOn";

    if (_id) {
      const { [createdOnField]: _ignore1, [createdByField]: _ignore2, ...safeData } = formData;

      await collection.updateOne(
        { _id: new ObjectId(_id) },
        {
          $set: {
            ...safeData,
            [modifiedOnField]: currentDate,
            [modifiedByField]: "admin",
          },
        }
      );
    } else {
      if (lookupName.toLowerCase() === "projectcreate" && formData.projectId) {
        const exists = await collection.findOne({ projectId: formData.projectId });
        if (exists) {
          return res.status(409).json({ error: "Project ID already exists" });
        }
      }

      await collection.insertOne({
        ...formData,
        [createdOnField]: currentDate,
        [createdByField]: "admin",
      });
    }

    simpleCache.clear();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error saving data:", err);
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------------------------- */
/* 3️⃣ DELETE Document                                                       */
/* -------------------------------------------------------------------------- */
export const deleteMongoData = async (req, res) => {
  const { lookupName, id } = req.params;
  try {
    await client.connect();
    const db = client.db(dbName);
    const collectionName = getCollectionName(lookupName);

    await db.collection(collectionName).deleteOne({ _id: new ObjectId(id) });

    simpleCache.clear();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error deleting data:", err);
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------------------------- */
/* 4️⃣ UPLOAD Excel                                                          */
/* -------------------------------------------------------------------------- */
export const uploadExcelData = async (req, res) => {
  try {
    const { collectionName } = req.params;
    const { fileName, data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Invalid or empty data." });
    }

    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const isSupplier = ["supplier", "supplier_PUR"].includes(collectionName);

    const enriched = data.map((record) => {
      const r = { ...record };
      r.file_name = fileName || "Unknown_File.xlsx";
      r.createdBy = "admin";
      r.createdOn = new Date();
      return r;
    });

    await collection.insertMany(enriched);

    simpleCache.clear();
    res.status(200).json({
      message: `${enriched.length} record(s) uploaded successfully.`,
    });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    res.status(500).json({ message: "Upload failed.", error });
  }
};

/* -------------------------------------------------------------------------- */
/* 5️⃣ BULK DROPDOWN ENDPOINT                                                 */
/* -------------------------------------------------------------------------- */
export const getFormDropdowns = async (req, res) => {
  try {
    const { collections, status } = req.query;
    if (!collections) return res.status(400).json({ error: "collections query required" });

    const cols = collections.split(",").map((c) => c.trim());
    await client.connect();
    const db = client.db(dbName);

    const payload = {};
    for (const c of cols) {
      payload[c] = await db.collection(getCollectionName(c)).find({}).toArray();
    }

    res.json({ dropdowns: payload });
  } catch (err) {
    console.error("❌ getFormDropdowns error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------------------------- */
/* 6️⃣ PROJECT ID APIs                                                        */
/* -------------------------------------------------------------------------- */
export const getNextProjectIdAPI = async (req, res) => {
  const { prefix } = req.query;
  await client.connect();
  const db = client.db(dbName);
  res.json({ projectId: await getNextProjectId(db, prefix) });
};

export const checkProjectIdAPI = async (req, res) => {
  const { projectId } = req.query;
  await client.connect();
  const db = client.db(dbName);

  const exists = await db
    .collection(getCollectionName("projectCreate"))
    .findOne({ projectId });

  res.json({ exists: !!exists });
};

export const getProjectDetails = async (req, res) => {
  const { id } = req.query;

  try {
    await client.connect();
    const db = client.db(dbName);

    /* ============================
       1️⃣ NEW PROJECT (projects)
    ============================ */
    if (ObjectId.isValid(id)) {
      const project = await db
        .collection("projects")
        .findOne({ _id: new ObjectId(id) });

      if (project) {
        const projectRefId = project._id.toString();

        const platforms = await db
          .collection("project_platforms")
          .find({ project_ref_id: projectRefId })
          .toArray();

        const fixedCostSavings = await db
          .collection("project_fixed_cost_savings")
          .find({ project_ref_id: projectRefId })
          .toArray();

        const documents = await db
          .collection("project_documents")
          .find({ project_ref_id: projectRefId })
          .toArray();

          // 🔑 Build metadata dynamically from projects collection
        const {
          _id,
          createdBy,
          createdOn,
          modifiedBy,
          modifiedOn,
          ...metadata
        } = project;
            
        return res.json({
          metadata,
          financial: {
            platforms,
            fixedCostSavings,
          },
          documents,
          source: "new",
        });
      }
    }

    /* ============================
       2️⃣ LEGACY PROJECT
    ============================ */
    let legacy = null;

// 1️⃣ Try by _id (MOST IMPORTANT)
if (ObjectId.isValid(id)) {
  legacy = await db
    .collection("projectCreate")
    .findOne({ _id: new ObjectId(id) });
}

// 2️⃣ Fallback by ProjectID (string)
if (!legacy) {
  legacy = await db
    .collection("projectCreate")
    .findOne({ ProjectID: id });
}

if (!legacy) {
  return res.status(404).json({ message: "Project not found" });
}

    return res.json({
      metadata: {
        projectId: legacy.ProjectID,
        projectNumber: legacy.projectNumber,
        description: legacy.Project_Description,
        startDate: legacy.Start_Date,
        functionGroup: legacy.functionGroup,
        projectOwner: legacy.projectOwner,
        purchasingAgent: legacy.purchasingAgent,
        brand: legacy.brand,
        risk: legacy.riskStatus,
        status: legacy.Status,
        conversionMode: legacy.conversionOpsMode,
        operationsSubMode: legacy.conversionOpsSubMode,
        inPlan: legacy.InPlan === "Y" ? "Yes" : "No",
      },
      financial: {
        platforms: (legacy.platforms || []).map((p, idx) => ({
          _id: `legacy-${idx}`,
          platform_ref_id: p.name,
          unit_cost: p.cost || 0,
          total_volume: 0,
          annualized_savings:
            legacy.Estimated_Annualized_Savings || 0,
        })),
        fixedCostSavings: (legacy.Repallmothval || []).map((m) => ({
          month: m.dateval,
          savings: m.savings,
        })),
      },
      documents: [],
      source: "legacy",
    });
  } catch (err) {
    console.error("Project details error:", err);
    res.status(500).json({ message: "Failed to load project details" });
  }
};




/* -------------------------------------------------------------------------- */
/* 7️⃣ DOWNLOAD PROJECT DOCUMENT                                              */
/* -------------------------------------------------------------------------- */
export const downloadProjectDocument = async (req, res) => {
  try {
    const { id } = req.params;

    await client.connect();
    const db = client.db(dbName);

    // 1️⃣ Fetch document metadata
    const doc = await db
      .collection("project_documents")
      .findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (!doc.gridfs_id) {
      return res.status(400).json({
        error: "Document is not stored in GridFS",
      });
    }

    // 2️⃣ Create GridFS bucket
    const bucket = new GridFSBucket(db, {
      bucketName: "fs", // default
    });

    // 3️⃣ Set headers
    res.set({
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${doc.file_name}"`,
    });

    // 4️⃣ Stream file from MongoDB to browser
    bucket
      .openDownloadStream(new ObjectId(doc.gridfs_id))
      .on("error", (err) => {
        console.error("❌ GridFS stream error:", err);
        res.status(500).end();
      })
      .pipe(res);

  } catch (err) {
    console.error("❌ Download failed:", err);
    res.status(500).json({ error: err.message });
  }
};
