// backend/utils/mongoMapper.js
import { ObjectId } from "mongodb";

/**
 * ✅ Safely checks if a value is a valid Mongo ObjectId string
 */
function isValidObjectId(id) {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Generic helper to map ObjectId references to actual display names
 *
 * @param {Object} db - MongoDB database connection
 * @param {Array} data - Array of base collection documents
 * @param {Array|String} mappingsOrCollection - Either mappings array OR collectionName (to look up centralized config)
 */

// Centralized mappings (normalized keys)
export const collectionLookupMappings = {
  subcommodity: [
    {
      localField: "commodityName",
      refCollection: "commodity",
      refField: "name",
      targetField: "commodityName",
    },
    {
      localField: "opsGroupNameRef",
      refCollection: "opsGroup",
      refField: "opsGroupName",
      targetField: "opsGroupNameRef",
    },
  ],

  idco: [
    {
      localField: "subcommodity_ref",
      refCollection: "subcommodity",
      refField: "subcommodityName",
      targetField: "subcommodity_ref",
    },
  ],

  opsmode: [
    {
      localField: "opsGroupNameRef",
      refCollection: "opsGroup",
      refField: "opsGroupName",
      targetField: "opsGroupNameRef",
    },
  ],

  opssubmode: [
    {
      localField: "opsGroupNameRef",
      refCollection: "opsGroup",
      refField: "opsGroupName",
      targetField: "opsGroupNameRef",
    },
  ],

  locations: [
    {
      localField: "opsGrp",
      refCollection: "opsGroup",
      refField: "opsGroupName",
      targetField: "opsGrp",
    },
    {
      localField: "functionalGroup",
      refCollection: "functionalGroup",
      refField: "functionalGroupName",
      targetField: "functionalGroup",
    },
  ],
};

/**
 * Map reference fields robustly: try matching by _id first (when ref is an ObjectId string),
 * then by the configured refField, then fallbacks.
 */
export async function mapReferenceFields(db, data, mappings = []) {
  // Accept either array of mappings or a collection name (string) to look up centralized config
  let usedMappings = mappings;
  if (typeof mappings === "string") {
    usedMappings = collectionLookupMappings[mappings.toLowerCase()] || [];
  }

  if (!usedMappings || usedMappings.length === 0) return data;

  const results = await Promise.all(
    data.map(async (item) => {
      const copy = { ...item };

      for (const map of usedMappings) {
        const localVal = copy[map.localField];
        if (!localVal) continue;

        let refDoc = null;

        // Try match by _id if it looks like an ObjectId
        if (isValidObjectId(localVal)) {
          try {
            refDoc = await db.collection(map.refCollection).findOne({ _id: new ObjectId(localVal) });
          } catch (e) {
            refDoc = null;
          }
        }

        // If not found, try match by refField === localVal
        if (!refDoc) {
          try {
            refDoc = await db.collection(map.refCollection).findOne({ [map.refField]: localVal });
          } catch (e) {
            refDoc = null;
          }
        }

        // Finally try matching refField as ObjectId (rare)
        if (!refDoc && isValidObjectId(localVal)) {
          try {
            refDoc = await db.collection(map.refCollection).findOne({ [map.refField]: new ObjectId(localVal) });
          } catch (e) {
            refDoc = null;
          }
        }

        const label =
          refDoc?.name ||
          refDoc?.displayName ||
          refDoc?.opsGroupName ||
          refDoc?.opsGroup ||
          refDoc?.title ||
          refDoc?.label ||
          refDoc?.description ||
          (refDoc?._id ? refDoc._id.toString() : null);

        copy[map.targetField || map.localField] = label ?? localVal;
      }

      return copy;
    })
  );

  return results;
}
