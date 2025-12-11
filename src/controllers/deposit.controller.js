import { createDeposit } from "../services/deposit.service.js";

export async function createDepositController(req, res) {
  try {
    const response = await createDeposit(req.body);
    res.status(201).json(response);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
