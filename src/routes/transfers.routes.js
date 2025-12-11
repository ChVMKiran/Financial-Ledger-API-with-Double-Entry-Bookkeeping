import { Router } from "express";
import { createTransferController } from "../controllers/transfer.controller.js";

const router = Router();

router.post("/", createTransferController);

export default router;
