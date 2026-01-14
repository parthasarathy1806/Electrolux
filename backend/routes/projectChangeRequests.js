import express from "express";
import { getProjectChangeRequests, createProjectChangeRequest } from "../controllers/projectChangeRequestsController.js";

const router = express.Router();

// GET /api/projects/change-requests?projectId=PU2003685
router.get("/change-requests", getProjectChangeRequests);

// POST /api/projects/change-requests
router.post("/change-requests", createProjectChangeRequest);

export default router;
