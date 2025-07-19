const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors("https://share-bites-app.netlify.app"));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_FOOD}:${process.env.DB_PASS}@cluster0.sj37ktr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const foodCollection = client.db("Food-Share").collection("foods");
    const requestCollection = client.db("Food-Share").collection("requests");

    // Get all foods
    app.get('/foods', async (req, res) => {
      try {
        const foods = await foodCollection.find().toArray();
        res.send(foods);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch foods', error });
      }
    });

    // Get single food by ID
    app.get('/foods/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid food ID' });
        }
        const food = await foodCollection.findOne({ _id: new ObjectId(id) });
        if (!food) {
          return res.status(404).send({ message: 'Food not found' });
        }
        res.send(food);
      } catch (error) {
        res.status(500).send({ message: 'Error fetching food', error });
      }
    });

    // Add new food
    app.post('/foods', async (req, res) => {
      try {
        const newFood = req.body;
        const result = await foodCollection.insertOne(newFood);
        res.status(201).send({ ...newFood, _id: result.insertedId });
      } catch (error) {
        res.status(500).send({ message: 'Failed to add food', error });
      }
    });

    // Delete food
    app.delete('/foods/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid food ID' });
        }
        const result = await foodCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
          res.send({ success: true, message: 'Food deleted successfully' });
        } else {
          res.status(404).send({ success: false, message: 'Food not found' });
        }
      } catch (error) {
        res.status(500).send({ success: false, message: 'Failed to delete food', error });
      }
    });

    // Add new request
    app.post('/requests', async (req, res) => {
      try {
        const newRequest = req.body;
        const result = await requestCollection.insertOne(newRequest);
        res.status(201).send({ ...newRequest, _id: result.insertedId });
      } catch (error) {
        res.status(500).send({ message: 'Failed to add request', error });
      }
    });

    // Update request status
    app.put('/requests/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid request ID' });
        }
        const status = req.body.status;
        const result = await requestCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: { status } },
          { returnDocument: 'after' }
        );
        if (!result.value) {
          return res.status(404).send({ message: 'Request not found' });
        }
        res.send(result.value);
      } catch (error) {
        res.status(500).send({ message: 'Error updating request', error });
      }
    });

    // PATCH /requests/:id
app.patch("/requests/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await Request.updateOne(
      { _id: id },
      { $set: { status } }
    );
    res.send({ success: true, message: "Status updated", result });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});


    // Get all requests
    app.get('/requests', async (req, res) => {
      try {
        const requests = await requestCollection.find().toArray();
        res.send(requests);
      } catch (error) {
        res.status(500).send({ message: 'Failed to fetch requests', error });
      }
    });


    // Test route
    app.get('/', (req, res) => {
      res.send('Server is running');
    });

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);
