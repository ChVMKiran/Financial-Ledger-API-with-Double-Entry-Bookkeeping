import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import accountsRouter from "./routes/accounts.routes.js";
import depositRouter from "./routes/deposits.routes.js";
import withdrawalRouter from "./routes/withdrawals.routes.js";
import transferRouter from "./routes/transfers.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/accounts", accountsRouter);
app.use("/deposits", depositRouter);
app.use("/withdrawals", withdrawalRouter);
app.use("/transfers", transferRouter);

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

export default app;
