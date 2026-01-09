// backend/routes/omdRoutes.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const { OMD_JWT } = process.env;

// 1️⃣ Load all environment variables starting with OMD_SCHEMA_
const OMD_SCHEMA_URLS = Object.keys(process.env)
  .filter((key) => key.startsWith("OMD_SCHEMA_"))
  .reduce((acc, key) => {
    const lookupName = key.replace("OMD_SCHEMA_", "").toLowerCase();
    acc[lookupName] = process.env[key];
    return acc;
  }, {});

// 2️⃣ GET /api/omd/schema/:lookup
router.get("/schema/:lookup", async (req, res) => {
  try {
    const { lookup } = req.params;
    const apiUrl = OMD_SCHEMA_URLS[lookup.toLowerCase()];

    if (!apiUrl) {
      return res.status(400).json({ error: `❌ No schema URL found for ${lookup}` });
    }

    const response = await axios.get(apiUrl, {
      headers: { Authorization: `Bearer ${OMD_JWT}` },
    });

    const omdSchema = response.data;

    // 3️⃣ Transform OMD schema → JSON schema
    const jsonSchema = {
      title: omdSchema.name || lookup,
      type: "object",
      properties: {},
    };

    // Handle column mapping
    (omdSchema.columns || []).forEach((col) => {
      if (["_id", "createdOn", "modifiedOn", "version", "__v"].includes(col.name))
        return;

      jsonSchema.properties[col.name] = {
        title: col.displayName || col.name,
        type:
          col.dataTypeDisplay?.toLowerCase().includes("float") ||
          col.dataTypeDisplay?.toLowerCase().includes("int")
            ? "number"
            : "string",
        description: col.dataTypeDisplay || "string",
      };
    });

    // Add enum for status fields
    Object.keys(jsonSchema.properties).forEach((key) => {
      if (key.toLowerCase().includes("status")) {
        jsonSchema.properties[key].enum = ["ACTIVE", "INACTIVE"];
      }
    });

    res.json(jsonSchema);
  } catch (err) {
    console.error("❌ Error fetching schema:", err.message);
    res.status(500).json({ error: "Failed to fetch schema" });
  }
});

export default router;
