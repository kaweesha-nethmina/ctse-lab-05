const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 8083);
const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB || "Lab05";

if (!mongoUri) {
  // eslint-disable-next-line no-console
  console.error("MONGODB_URI environment variable is not set.");
  process.exit(1);
}

const client = new MongoClient(mongoUri);
let paymentsCollection;

app.get("/payments", async (req, res) => {
  try {
    const docs = await paymentsCollection.find({}).sort({ id: 1 }).toArray();
    const result = docs.map((d) => ({
      id: d.id,
      orderId: d.orderId,
      amount: d.amount,
      method: d.method,
      status: d.status
    }));
    res.json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error fetching payments:", err);
    res.status(500).json({ message: "Failed to fetch payments." });
  }
});

app.post("/payments/process", async (req, res) => {
  try {
    const orderId = Number(req.body?.orderId);
    const amount = Number(req.body?.amount);
    const method = typeof req.body?.method === "string" ? req.body.method.trim() : "";

    if (!Number.isFinite(orderId) || orderId <= 0)
      return res.status(400).json({ message: "Field 'orderId' must be a positive number." });
    if (!Number.isFinite(amount) || amount <= 0)
      return res.status(400).json({ message: "Field 'amount' must be a positive number." });
    if (!method) return res.status(400).json({ message: "Field 'method' is required." });

    const last = await paymentsCollection.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = (last[0]?.id || 0) + 1;

    const doc = { id: nextId, orderId, amount, method, status: "SUCCESS" };
    await paymentsCollection.insertOne(doc);
    return res.status(201).json(doc);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error creating payment:", err);
    res.status(500).json({ message: "Failed to process payment." });
  }
});

app.get("/payments/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id." });

    const doc = await paymentsCollection.findOne({ id });
    if (!doc) return res.status(404).json({ message: "Payment not found." });
    return res.json(doc);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error fetching payment:", err);
    res.status(500).json({ message: "Failed to fetch payment." });
  }
});

app.get("/health", async (req, res) => {
  try {
    await paymentsCollection.estimatedDocumentCount();
    res.json({ status: "ok", service: "payment-service", db: mongoDbName });
  } catch (err) {
    res.status(500).json({ status: "error", service: "payment-service" });
  }
});

async function start() {
  try {
    await client.connect();
    const db = client.db(mongoDbName);
    paymentsCollection = db.collection("payments");

    app.listen(PORT, "0.0.0.0", () => {
      // eslint-disable-next-line no-console
      console.log(`payment-service listening on ${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to start payment-service:", err);
    process.exit(1);
  }
}

start();

