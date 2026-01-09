// backend/server.js
import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { graphqlMiddleware } from "./graphql/index.js";
// import { graphqlHTTP } from "express-graphql"; // ✅ import directly
// import schema from "./graphql/schema.js"; // ✅ updated schema import
// import resolvers from "./graphql/resolvers.js"; // ✅ import resolvers
import financialRoutes from "./routes/financialRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

dotenv.config({ path: "../.env" });

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Connect to MongoDB
connectDB();

// Static folder
app.use("/public", express.static(path.join(process.cwd(), "public")));

// REST routes (existing)
app.use("/api/mongo", (await import("./routes/mongoRoutes.js")).default);
app.use("/api/omd", (await import("./routes/omdRoutes.js")).default);

// ✅ GraphQL setup (non-breaking addition)
app.use(
  "/graphql", graphqlMiddleware
);

// Financial routes
app.use("/api/financial", financialRoutes);

// Project routes
app.use("/api/projects", projectRoutes);


// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
