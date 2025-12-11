import { Router } from "express";
import {
  createAccountController,
  getAccountByIdController,
  getAccountLedgerController
} from "../controllers/accounts.controller.js";

const router = Router();

router.post("/", createAccountController);
router.get("/:id", getAccountByIdController);
router.get("/:id/ledger", getAccountLedgerController);

export default router;
