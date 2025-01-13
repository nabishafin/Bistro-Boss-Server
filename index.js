require('dotenv').config();
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
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


        // jwt releted Api
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SCERET, {
                expiresIn: '1h'
            });
            res.send({ token })

        })


        // get all menu data
        app.get('/menu', async (req, res) => {
            const result = await bistroDB.find().toArray();
            res.send(result)
        })

        // post menu
        app.post('/menus', async (req, res) => {
            const menu = req.body;
            const result = await bistroDB.insertOne(menu);
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



        // dashboard
        // post all cart by click add to cart in post methodes
        app.post('/carts', async (req, res) => {
            const cartItem = req.body
            const result = await cartsDB.insertOne(cartItem)
            res.send(result)
        })

        // delte cartItem
        app.delete("/carts/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartsDB.deleteOne(query);
            res.send(result);
        });

        // user collection by post methods
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await usersDB.findOne(query)
            if (existingUser) {
                return res.send({ message: 'user alredy exitets' })
            }
            const result = usersDB.insertOne(user)
            res.send(result)
        })

        //    middleware 
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'Unauthorized Access' });
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SCERET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'Unauthorized Access' });
                }
                req.decoded = decoded;
                next();
            });
        }

        // Admin verification middleware
        const vaifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await usersDB.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'Forbidden access' });
            }
            next();
        }

        // Example route that uses the middlewares



        // admin Role
        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forBidden access' })
            }
            const query = { email: email }
            const user = await usersDB.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin })

        })

        // get all user 
        app.get('/users', verifyToken, vaifyAdmin, async (req, res) => {
            const result = await usersDB.find().toArray();
            res.send(result)
        })


        // delet User
        app.delete("/users/:id", verifyToken, vaifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await usersDB.deleteOne(query);
            res.send(result);
        });

        // admin role
        app.patch("/users/admin/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersDB.updateOne(filter, updatedDoc)
            res.send(result)
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