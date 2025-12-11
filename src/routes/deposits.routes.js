import { Router } from "express";
import { createDepositController } from "../controllers/deposit.controller.js";

const router = Router();

router.post("/", createDepositController);

export default router;
