import { createTransfer } from "../services/transfer.service.js";

export async function createTransferController(req, res) {
  try {
    const response = await createTransfer(req.body);
    res.status(201).json(response);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
