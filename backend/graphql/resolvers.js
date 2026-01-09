import { client, dbName } from "../controllers/mongoController.js";
import dayjs from "dayjs";
import { ObjectId } from "mongodb";
import {
  mapReferenceFields,
  collectionLookupMappings,
} from "../common/mongoMapperCore.js";

/* -------------------------------------------------------------------------- */
/* 🔌 Mongo Singleton                                                          */
/* -------------------------------------------------------------------------- */
let dbInstance = null;

const getDB = async () => {
  if (!dbInstance) {
    if (!client.topology?.isConnected()) {
      await client.connect();
    }
    dbInstance = client.db(dbName);
  }
  return dbInstance;
};

/* -------------------------------------------------------------------------- */
/* 🔤 Lookup Name Normalizer                                                    */
/* -------------------------------------------------------------------------- */
const normalizeLookupName = (name = "") =>
  name.toLowerCase().replace(/[_-]/g, "");

/* -------------------------------------------------------------------------- */
/* 🔑 Lookup → Collection Mapping (ENV-AWARE)                                   */
/* -------------------------------------------------------------------------- */
const LOOKUP_COLLECTION_MAP = {
  brand: process.env.COLLECTION_BRAND,

  commodity: process.env.COLLECTION_COMMODITY,
  subcommodity: process.env.COLLECTION_SUBCOMMODITY,

  idco: process.env.COLLECTION_IDCO,
  idcotable: process.env.COLLECTION_IDCO,

  locations: process.env.COLLECTION_LOCATIONS,

  opsmode: process.env.COLLECTION_OPSMODE,
  conversionopsmode: process.env.COLLECTION_OPSMODE,
  opssubmode: process.env.COLLECTION_OPSSUBMODE,

  opsgroup: process.env.COLLECTION_OPSGROUP,
  opssubgroup: process.env.COLLECTION_OPSSUBGROUP,

  productline: process.env.COLLECTION_PRODUCTLINE,
  productproductline: process.env.COLLECTION_PRODUCTLINE,

  supplier: process.env.COLLECTION_SUPPLIER,
  supplierpur: process.env.COLLECTION_SUPPLIER,

  functionalgroup: process.env.COLLECTION_FUNCTIONALGROUP,

  projectstatus: process.env.COLLECTION_PROJECTSTATUS,
  bigrocks: process.env.COLLECTION_BIGROCKS,

  usersclean: "users",
};

/* -------------------------------------------------------------------------- */
/* 🧠 Resolvers                                                                 */
/* -------------------------------------------------------------------------- */
const resolvers = {
  Query: {
    /* ===============================
       🔍 Generic Lookup Resolver
       (NOW MATCHES REST BEHAVIOR)
    =============================== */
    getLookupData: async (_, { lookupName, status }) => {
      const db = await getDB();

      const normalized = normalizeLookupName(lookupName);
      const collectionName = LOOKUP_COLLECTION_MAP[normalized];

      if (!collectionName) {
        console.warn("❌ Unknown lookupName:", lookupName);
        return [];
      }

      const query = {};
      if (status) {
        query.$or = [
          { status },
          { brandStatus: status },
          { projectStatusStatus: status },
        ];
      }

      let data = await db.collection(collectionName).find(query).toArray();

      /* ✅ APPLY SAME REFERENCE MAPPING AS REST */
      if (collectionLookupMappings[normalized]) {
        data = await mapReferenceFields(db, data, normalized);
      }

      return data;
    },

    /* ===============================
       💰 Financial Platforms (UNCHANGED)
    =============================== */
    getFinancialPlatforms: async (_, { functionalGroupId }) => {
  const db = await getDB();

  let fgValue;
  try {
    fgValue = new ObjectId(functionalGroupId);
  } catch {
    fgValue = functionalGroupId;
  }

  const psiMappings = await db
    .collection("fg_to_psi_group_direct_platforms")
    .find({ functionGrpId: fgValue })
    .toArray();

  const isDirect = psiMappings.length > 0;
  let platforms = [];

  if (isDirect) {
    const psiGroups = psiMappings.map((m) => m.psi_Groups);

    platforms = await db
      .collection("platformVolume_Direct")
      .find({ psiGroup: { $in: psiGroups } })
      .toArray();
  } else {
    platforms = await db
      .collection("platformVolume_Common")
      .find({ functionalGroup: fgValue })
      .toArray();
  }

  if (!platforms.length) return [];

  const platformIds = platforms.map((p) => p._id.toString());

  const monthlyRows = await db
    .collection("platform_monthly_savings_all_types")
    .find({ platform_id: { $in: platformIds } })
    .toArray();

  const monthlyMap = {};
  monthlyRows.forEach((m) => {
    const ym = dayjs(m.month).format("YYYY-MM");
    if (!monthlyMap[m.platform_id]) monthlyMap[m.platform_id] = {};
    monthlyMap[m.platform_id][ym] = m.savings;
  });

  return platforms.map((p) => {
    const pid = p._id.toString();
    return {
      platformId: pid,
      platformName: p.platform,
      platformCategory: isDirect ? "DIRECT" : "COMMON",
      months: monthlyMap[pid] || {},
    };
  });
},
  },
};

export default resolvers;
