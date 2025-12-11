import prisma from "../prismaClient.js";

async function computeBalance(tx, accountId) {
  const entries = await tx.ledgerEntry.findMany({ where: { accountId } });
  let balance = 0;

  for (const entry of entries) {
    const amt = Number(entry.amount);
    balance += entry.entryType === "credit" ? amt : -amt;
  }
  return balance;
}

export async function createTransfer({ fromAccountId, toAccountId, amount, currency, description }) {

  if (fromAccountId === toAccountId) throw new Error("Cannot transfer to same account");
  if (amount <= 0) throw new Error("Amount must be positive");

  return prisma.$transaction(async (tx) => {
    const accounts = await tx.account.findMany({
      where: { id: { in: [fromAccountId, toAccountId] } }
    });

    const from = accounts.find(a => a.id === fromAccountId);
    const to = accounts.find(a => a.id === toAccountId);

    if (!from || !to) throw new Error("One or both accounts not found");

    if (from.currency !== currency || to.currency !== currency)
      throw new Error("Currency mismatch");

    const balance = await computeBalance(tx, fromAccountId);
    if (amount > balance) throw new Error("Insufficient balance");

    const transaction = await tx.transaction.create({
      data: {
        transactionType: "transfer",
        amount,
        currency,
        status: "pending",
        description
      }
    });

    await tx.ledgerEntry.createMany({
      data: [
        { accountId: from.id, transactionId: transaction.id, entryType: "debit", amount },
        { accountId: to.id, transactionId: transaction.id, entryType: "credit", amount }
      ]
    });

    const completed = await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: "completed" }
    });

    return { message: "Transfer successful", transaction: completed };
  });
}
