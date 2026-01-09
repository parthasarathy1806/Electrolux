import express from "express";
import { getFinancialPlatforms } from "../controllers/financialController.js";
import { getPlatformMonthlySavings } from "../controllers/financialController.js";

const router = express.Router();

router.get("/platforms", getFinancialPlatforms);

router.get("/platform-monthly", getPlatformMonthlySavings);

export default router;
