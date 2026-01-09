// backend/graphql/mongoMapperSchema.js
import { client, dbName } from "../controllers/mongoController.js";
import { mapReferenceFields } from "../common/mongoMapperCore.js"; // ✅ unified import

/* -------------------------------------------------------------------------- */
/* 1️⃣ GraphQL type definitions (used for schema combination)                 */
/* -------------------------------------------------------------------------- */
export const mongoMapperTypeDefs = `#graphql
  type SubCommodity {
    _id: ID
    name: String
    commodityName: String
    opsGroupNameRef: String
  }

  type Idco {
    _id: ID
    name: String
    subcommodity_ref: String
  }

  type OpsMode {
    _id: ID
    name: String
    opsGroupNameRef: String
  }

  type OpsSubMode {
    _id: ID
    name: String
    opsGroupNameRef: String
  }

  type Location {
    _id: ID
    name: String
    opsGrp: String
    functionalGroup: String
  }

  extend type Query {
    getSubCommodities: [SubCommodity]
    getIdcos: [Idco]
    getOpsModes: [OpsMode]
    getOpsSubModes: [OpsSubMode]
    getLocations: [Location]
  }
`;

/* -------------------------------------------------------------------------- */
/* 2️⃣ GraphQL resolvers — call unified mapReferenceFields from core          */
/* -------------------------------------------------------------------------- */
export const mongoMapperResolvers = {
  Query: {
    getSubCommodities: async () => {
      await client.connect();
      const db = client.db(dbName);
      const data = await db.collection("subcommodity").find({}).toArray();
      return mapReferenceFields(db, data, "subcommodity");
    },

    getIdcos: async () => {
      await client.connect();
      const db = client.db(dbName);
      const data = await db.collection("idco").find({}).toArray();
      return mapReferenceFields(db, data, "idco");
    },

    getOpsModes: async () => {
      await client.connect();
      const db = client.db(dbName);
      const data = await db.collection("opsMode").find({}).toArray();
      return mapReferenceFields(db, data, "opsmode"); // ✅ lowercase key
    },

    getOpsSubModes: async () => {
      await client.connect();
      const db = client.db(dbName);
      const data = await db.collection("opsSubMode").find({}).toArray();
      return mapReferenceFields(db, data, "opssubmode"); // ✅ lowercase key
    },

    getLocations: async () => {
      await client.connect();
      const db = client.db(dbName);
      const data = await db.collection("locations").find({}).toArray();
      return mapReferenceFields(db, data, "locations");
    },
  },
};
