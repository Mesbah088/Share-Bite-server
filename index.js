const express = require('express')
const  cors = require('cors')
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors())
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_FOOD}:${process.env.DB_PASS}@cluster0.sj37ktr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    
    const foodCollection = client.db("Food-Share").collection("foods");

    // Foods API

    app.get("/foods", async (req, res) => {
  try {
    const foods = await foodCollection.find().toArray();
    res.send(foods);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch food items", error });
  }
});

// Add food

// Express.js server
app.post('/foods', async (req, res) => {
  try {
    const newFood = req.body;
    const result = await foodCollection.insertOne(newFood);
    res.status(201).send(result);
  } catch (err) {
    res.status(500).send({ message: 'Failed to add food', error: err.message });
  }
});

// Add food
app.post('/foods', async (req, res) => {
  try {
    const newFood = req.body;
    const result = await foodCollection.insertOne(newFood);
    res.status(201).send({ ...newFood, _id: result.insertedId });
  } catch (err) {
    res.status(500).send({ message: 'Error adding food', error: err });
  }
});

// Update request status
app.put('/requests/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const status = req.body.status;
    const result = await requestCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status } },
      { returnDocument: 'after' }
    );
    res.send(result.value);
  } catch (err) {
    res.status(500).send({ message: 'Error updating request', error: err });
  }
});



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Sample route
app.get('/', (req, res) => {
  res.send('Server is running')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
