// backend/routes/mongoRoutes.js
import express from "express";
import {
  getMongoData,
  addOrUpdateMongoData,
  deleteMongoData,
  uploadExcelData,
  getFormDropdowns,
  getNextProjectIdAPI,
  checkProjectIdAPI,
  getProjectDetails,
  downloadProjectDocument,
} from "../controllers/mongoController.js";

const router = express.Router();

// Dynamic data route
router.get("/data/:lookupName", getMongoData);

// New: form-data endpoint to fetch multiple dropdown collections at once
router.get("/form-data", getFormDropdowns);

router.post("/data/:lookupName", addOrUpdateMongoData);
router.put("/data/:lookupName/:id", addOrUpdateMongoData);
router.delete("/data/:lookupName/:id", deleteMongoData);
router.post("/upload/:collectionName", uploadExcelData);
router.get("/projects/next-id", getNextProjectIdAPI);
router.get("/projects/check-id", checkProjectIdAPI);
router.get("/projects/details", getProjectDetails);
router.get(
  "/documents/download/:id",
  downloadProjectDocument
);


export default router;
