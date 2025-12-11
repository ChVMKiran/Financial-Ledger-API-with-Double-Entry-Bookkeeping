import { Router } from "express";
import { createWithdrawalController } from "../controllers/withdrawal.controller.js";

const router = Router();

router.post("/", createWithdrawalController);

export default router;
