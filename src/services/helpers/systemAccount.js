import prisma from "../../prismaClient.js";

export async function getOrCreateSystemAccount(tx, currency) {
  let systemAccount = await tx.account.findFirst({
    where: {
      userId: "system",
      accountType: "system",
      currency
    }
  });

  if (!systemAccount) {
    systemAccount = await tx.account.create({
      data: {
        userId: "system",
        accountType: "system",
        currency,
        status: "active"
      }
    });
  }

  return systemAccount;
}
