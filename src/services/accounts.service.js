import prisma from "../prismaClient.js";

export async function createAccount({ userId, accountType, currency }) {
  return prisma.account.create({
    data: { userId, accountType, currency, status: "active" }
  });
}

export async function getAccountById(accountId) {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { ledgerEntries: true }
  });

  if (!account) throw new Error("Account not found");

  let balance = 0;
  for (const entry of account.ledgerEntries) {
    const amt = Number(entry.amount);
    balance += entry.entryType === "credit" ? amt : -amt;
  }

  return { ...account, balance };
}

export async function getAccountLedger(accountId) {
  return prisma.ledgerEntry.findMany({
    where: { accountId },
    orderBy: { createdAt: "asc" }
  });
}
