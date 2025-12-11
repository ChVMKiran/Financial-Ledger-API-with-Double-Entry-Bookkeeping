import {
  createAccount,
  getAccountById,
  getAccountLedger
} from "../services/accounts.service.js";

export async function createAccountController(req, res) {
  try {
    const account = await createAccount(req.body);
    res.status(201).json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getAccountByIdController(req, res) {
  try {
    const account = await getAccountById(req.params.id);
    res.status(200).json(account);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

export async function getAccountLedgerController(req, res) {
  try {
    const ledger = await getAccountLedger(req.params.id);
    res.status(200).json(ledger);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}
