// backend/common/mongoMapperCore.js
import { ObjectId } from "mongodb";

/**
 * ✅ Centralized lookup mapping configuration (normalized lowercase keys)
 */
export const collectionLookupMappings = {
  subcommodity: [
    {
      localField: "commodityName",
      from: "commodity",
      foreignField: "_id",
      as: "commodityName",
    },
    {
      localField: "opsGroupNameRef",
      from: "opsGroup",
      foreignField: "_id",
      as: "opsGroupNameRef",
    },
  ],
  idco: [
    {
      localField: "subcommodity_ref",
      from: "subcommodity",
      foreignField: "_id",
      as: "subcommodity_ref",
    },
  ],
  opsmode: [
    {
      localField: "opsGroupNameRef",
      from: "opsGroup",
      foreignField: "_id",
      as: "opsGroupNameRef",
    },
  ],
  opssubmode: [
    {
      localField: "opsGroupNameRef",
      from: "opsGroup",
      foreignField: "_id",
      as: "opsGroupNameRef",
    },
  ],
  locations: [
    {
      localField: "opsGrp",
      from: "opsGroup",
      foreignField: "_id",
      as: "opsGrp",
    },
    {
      localField: "functionalGroup",
      from: "functionalGroup",
      foreignField: "_id",
      as: "functionalGroup",
    },
  ],
};

/**
 * ✅ Helper function to determine if a string is a valid ObjectId
 */
function isValidObjectId(id) {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * ✅ Generic helper: maps ObjectId/string references to human-readable names
 */
export async function mapReferenceFields(db, data, collectionName) {
  const mappings = collectionLookupMappings[collectionName?.toLowerCase?.()] || [];
  if (!mappings.length) return data;

  return Promise.all(
    data.map(async (doc) => {
      const enriched = { ...doc };

      for (const map of mappings) {
        const refValue = doc[map.localField];
        if (!refValue) continue;

        let refDoc = null;

        // 1️⃣ Try _id match if refValue looks like ObjectId
        if (isValidObjectId(refValue)) {
          try {
            refDoc = await db.collection(map.from).findOne({ _id: new ObjectId(refValue) });
          } catch {
            refDoc = null;
          }
        }

        // 2️⃣ Try foreignField match (string → opsGroupName, etc.)
        if (!refDoc) {
          try {
            refDoc = await db.collection(map.from).findOne({ [map.foreignField]: refValue });
          } catch {
            refDoc = null;
          }
        }

        // 3️⃣ Optional fallback (rare)
        if (!refDoc && isValidObjectId(refValue)) {
          try {
            refDoc = await db.collection(map.from).findOne({ [map.foreignField]: new ObjectId(refValue) });
          } catch {
            refDoc = null;
          }
        }

        // 4️⃣ Pick readable field
        const refName =
          refDoc?.subcommodityName ||   // 🟢 for idco lookups
          refDoc?.functionalGroupName || // 🟢 for locations lookups
          refDoc?.commodityName ||       // optional: for subcommodity lookups
          refDoc?.opsGroupName ||
          refDoc?.name ||
          refDoc?.displayName ||
          refDoc?.title ||
          refDoc?.label ||
          refDoc?.description ||
          (refDoc?._id ? refDoc._id.toString() : null);
          enriched[map.as] = refName || refValue;
      }

      return enriched;
    })
  );
}
