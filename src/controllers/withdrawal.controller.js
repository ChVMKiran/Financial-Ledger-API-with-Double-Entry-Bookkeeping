import { createWithdrawal } from "../services/withdrawal.service.js";

export async function createWithdrawalController(req, res) {
  try {
    const response = await createWithdrawal(req.body);
    res.status(201).json(response);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
