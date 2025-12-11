import prisma from "../prismaClient.js";
import { getOrCreateSystemAccount } from "./helpers/systemAccount.js";

export async function createDeposit({ accountId, amount, currency, description }) {

  if (amount <= 0) throw new Error("Amount must be positive");

  return prisma.$transaction(async (tx) => {
    const account = await tx.account.findUnique({ where: { id: accountId } });
    if (!account) throw new Error("Account not found");
    if (account.currency !== currency) throw new Error("Currency mismatch");

    const systemAccount = await getOrCreateSystemAccount(tx, currency);

    const transaction = await tx.transaction.create({
      data: {
        transactionType: "deposit",
        amount,
        currency,
        status: "pending",
        description
      }
    });

    await tx.ledgerEntry.createMany({
      data: [
        { accountId: systemAccount.id, transactionId: transaction.id, entryType: "debit", amount },
        { accountId: account.id, transactionId: transaction.id, entryType: "credit", amount }
      ]
    });

    const completed = await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: "completed" }
    });

    return { message: "Deposit successful", transaction: completed };
  });
}
