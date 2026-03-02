const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 8081);
const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB || "Lab05";

if (!mongoUri) {
  // eslint-disable-next-line no-console
  console.error("MONGODB_URI environment variable is not set.");
  process.exit(1);
}

const client = new MongoClient(mongoUri);
let itemsCollection;

app.get("/items", async (req, res) => {
  try {
    const docs = await itemsCollection.find({}).sort({ id: 1 }).toArray();
    const result = docs.map((d) => ({ id: d.id, name: d.name }));
    res.json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error fetching items:", err);
    res.status(500).json({ message: "Failed to fetch items." });
  }
});

app.post("/items", async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name) return res.status(400).json({ message: "Field 'name' is required." });

    const last = await itemsCollection.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = (last[0]?.id || 0) + 1;

    const doc = { id: nextId, name };
    await itemsCollection.insertOne(doc);
    return res.status(201).json({ id: doc.id, name: doc.name });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error creating item:", err);
    res.status(500).json({ message: "Failed to create item." });
  }
});

app.get("/items/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid id." });
    }

    const doc = await itemsCollection.findOne({ id });
    if (!doc) return res.status(404).json({ message: "Item not found." });
    return res.json({ id: doc.id, name: doc.name });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error fetching item:", err);
    res.status(500).json({ message: "Failed to fetch item." });
  }
});

app.get("/health", async (req, res) => {
  try {
    // Simple ping to ensure DB connection is alive
    await itemsCollection.estimatedDocumentCount();
    res.json({ status: "ok", service: "item-service", db: mongoDbName });
  } catch (err) {
    res.status(500).json({ status: "error", service: "item-service" });
  }
});

async function start() {
  try {
    await client.connect();
    const db = client.db(mongoDbName);
    itemsCollection = db.collection("items");

    const existingCount = await itemsCollection.countDocuments();
    if (existingCount === 0) {
      await itemsCollection.insertMany([
        { id: 1, name: "Book" },
        { id: 2, name: "Laptop" },
        { id: 3, name: "Phone" }
      ]);
    }

    app.listen(PORT, "0.0.0.0", () => {
      // eslint-disable-next-line no-console
      console.log(`item-service listening on ${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to start item-service:", err);
    process.exit(1);
  }
}

start();
