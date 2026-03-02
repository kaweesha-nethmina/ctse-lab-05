const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 8082);
const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB || "Lab05";

if (!mongoUri) {
  // eslint-disable-next-line no-console
  console.error("MONGODB_URI environment variable is not set.");
  process.exit(1);
}

const client = new MongoClient(mongoUri);
let ordersCollection;

app.get("/orders", async (req, res) => {
  try {
    const docs = await ordersCollection.find({}).sort({ id: 1 }).toArray();
    const result = docs.map((d) => ({
      id: d.id,
      item: d.item,
      quantity: d.quantity,
      customerId: d.customerId,
      status: d.status
    }));
    res.json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Failed to fetch orders." });
  }
});

app.post("/orders", async (req, res) => {
  try {
    const item = typeof req.body?.item === "string" ? req.body.item.trim() : "";
    const quantity = Number(req.body?.quantity);
    const customerId = typeof req.body?.customerId === "string" ? req.body.customerId.trim() : "";

    if (!item) return res.status(400).json({ message: "Field 'item' is required." });
    if (!Number.isFinite(quantity) || quantity <= 0)
      return res.status(400).json({ message: "Field 'quantity' must be a positive number." });
    if (!customerId) return res.status(400).json({ message: "Field 'customerId' is required." });

    const last = await ordersCollection.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = (last[0]?.id || 0) + 1;

    const doc = { id: nextId, item, quantity, customerId, status: "PENDING" };
    await ordersCollection.insertOne(doc);
    return res.status(201).json(doc);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Failed to create order." });
  }
});

app.get("/orders/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id." });

    const doc = await ordersCollection.findOne({ id });
    if (!doc) return res.status(404).json({ message: "Order not found." });
    return res.json(doc);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error fetching order:", err);
    res.status(500).json({ message: "Failed to fetch order." });
  }
});

app.get("/health", async (req, res) => {
  try {
    await ordersCollection.estimatedDocumentCount();
    res.json({ status: "ok", service: "order-service", db: mongoDbName });
  } catch (err) {
    res.status(500).json({ status: "error", service: "order-service" });
  }
});

async function start() {
  try {
    await client.connect();
    const db = client.db(mongoDbName);
    ordersCollection = db.collection("orders");

    app.listen(PORT, "0.0.0.0", () => {
      // eslint-disable-next-line no-console
      console.log(`order-service listening on ${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to start order-service:", err);
    process.exit(1);
  }
}

start();
