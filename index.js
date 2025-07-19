// server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Allowed origins for CORS (local dev and production frontend)
const allowedOrigins = [
  "https://share-bites-app.netlify.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin like Postman or curl
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_FOOD}:${process.env.DB_PASS}@cluster0.sj37ktr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});

// JWT verification middleware
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).send({ error: "Forbidden" });
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully");

    const db = client.db("Food-Share");
    const foodCollection = db.collection("foods");
    const requestCollection = db.collection("requests");

    // Route to generate JWT token
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "2h" });
      res.send({ token });
    });

    // Get all foods
    app.get("/foods", async (req, res) => {
      const foods = await foodCollection.find().toArray();
      res.send(foods);
    });

    // Protected route: get user's own requests
    app.get("/my-requests", verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (req.decoded.email !== email) {
        return res.status(403).send({ error: "Forbidden access" });
      }
      const requests = await requestCollection.find({ requesterEmail: email }).toArray();
      res.send(requests);
    });

    // Create a new food request
    app.post("/requests", async (req, res) => {
      const newRequest = req.body;
      const result = await requestCollection.insertOne(newRequest);
      res.status(201).send(result);
    });

    // Update request status (protected)
    app.put("/requests/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid request ID" });
      }

      const updated = await requestCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status } },
        { returnDocument: "after" }
      );

      if (!updated.value) {
        return res.status(404).send({ message: "Request not found" });
      }

      res.send(updated.value);
    });

    // Server test route
    app.get("/", (req, res) => {
      res.send("Food Sharing server is running...");
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

run().catch(console.dir);
