import prisma from "../prismaClient.js";
import { getOrCreateSystemAccount } from "./helpers/systemAccount.js";

export async function createWithdrawal({ accountId, amount, currency, description }) {

  if (amount <= 0) throw new Error("Amount must be positive");

  return prisma.$transaction(async (tx) => {
    const account = await tx.account.findUnique({
      where: { id: accountId },
      include: { ledgerEntries: true }
    });

    if (!account) throw new Error("Account not found");
    if (account.currency !== currency) throw new Error("Currency mismatch");

    let balance = 0;
    for (const entry of account.ledgerEntries) {
      const amt = Number(entry.amount);
      balance += entry.entryType === "credit" ? amt : -amt;
    }

    if (amount > balance) throw new Error("Insufficient balance");

    const systemAccount = await getOrCreateSystemAccount(tx, currency);

    const transaction = await tx.transaction.create({
      data: {
        transactionType: "withdrawal",
        amount,
        currency,
        status: "pending",
        description
      }
    });

    await tx.ledgerEntry.createMany({
      data: [
        { accountId: account.id, transactionId: transaction.id, entryType: "debit", amount },
        { accountId: systemAccount.id, transactionId: transaction.id, entryType: "credit", amount }
      ]
    });

    const completed = await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: "completed" }
    });

    return { message: "Withdrawal successful", transaction: completed };
  });
}
