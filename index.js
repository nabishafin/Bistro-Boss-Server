require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dkwhsex.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        await client.connect();
        const bistroDB = client.db("bistroDb").collection("menu");
        const reviewsDB = client.db("bistroDb").collection("reviews");
        const cartsDB = client.db("bistroDb").collection("carts");
        const usersDB = client.db("bistroDb").collection("users");

        // get all menu data
        app.get('/menu', async (req, res) => {
            const result = await bistroDB.find().toArray();
            res.send(result)
        })

        // get all reviews data
        app.get('/reviews', async (req, res) => {
            const result = await reviewsDB.find().toArray();
            res.send(result)
        })

        // get all menu by get methods 
        app.get('/carts', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const result = await cartsDB.find(query).toArray();
            res.send(result)
        })

        // post all cart by click add to cart in post methodes

        app.post('/carts', async (req, res) => {
            const cartItem = req.body
            const result = await cartsDB.insertOne(cartItem)
            res.send(result)
        })

        // delte cartItem
        app.delete("/carts/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: new ObjectId(id) };
            const result = await cartsDB.deleteOne(query);
            res.send(result);
        });

        // user collection by post methods
        app.post('/users', async (req, res) => {
            try {
                const user = req.body;

                // Check if email is provided
                if (!user.email) {
                    return res.status(400).send({ message: 'Email is required' });
                }

                const query = { email: user.email };
                const existingUser = await usersDB.findOne(query);

                if (existingUser) {
                    return res.status(409).send({ message: 'User already exists' }); // HTTP 409 for conflict
                }

                const result = await usersDB.insertOne(user);
                res.status(201).send({ message: 'User created successfully', result });
            } catch (error) {
                console.error('Error inserting user:', error);
                res.status(500).send({ message: 'Internal server error' });
            }
        })





        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello, BOSS');
});


// Start server

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});