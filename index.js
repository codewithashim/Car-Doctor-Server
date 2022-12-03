const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("colors");
require("dotenv").config();
const app = express();
const port = 5000;
const cors = require("cors");
const { yellow } = require("colors");
const jwt = require("jsonwebtoken");
const { json } = require("express");

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hey there! wellcome to car docter server !!!");
});

/// ========================= DB Connection =========================
const DB_User = process.env.DB_USER;
const DB_Pass = process.env.DB_PASSWORD;

const uri = `mongodb+srv://${DB_User}:${DB_Pass}@cardoctor.e0xvtmm.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function dbConnect() {
  try {
    await client.connect();
    console.log("DB Connected".yellow);
  } catch (error) {
    console.log(error.name.bgRed, error.message.bold);
  }
}
dbConnect();

//=========================DB Collections=============================
// const db = client.db("carDoctor"); // Database Name
// const servicesCollection = db.collection("services"); // Collection Name
const serviceCollection = client.db("carDoctor").collection("services");
const orderCollection = client.db("carDoctor").collection("orders");

//========================= verify token =============================

function verifyTokenJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({
      success: false,
      message: "Unauthorized access",
    });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.MAIN_JWT_SECRIPT_KEY, function (err, decoded) {
    if (err) {
      return res.status(401).send({
        success: false,
        message: "unauthorized access",
      });
    }
    req.decoded = decoded;
    next();
  });
}

// endpoint

app.get("/services", async (req, res) => {
  try {
    const order = req.query.order === "ase" ? 1 : -1;
    // shorting data
    // const query = { price: { $lt: 100 }};
    // const query = { price: { $gt: 100 } };
    // const query = { price: { $eq: 200 } };
    // const query = { price: { $gte: 100 } };
    // const query = { price: { $lte: 100 } };
    // const query = { price: { $ne: 100 } };
    // const query = { price: { $in: [100, 25, 20, 90, 200] } };
    // const query = { price: { $nin: [100, 25, 20, 90, 200] } };
    // const query = { price: { $exists: true } };
    // const query = { price: { $exists: false } };
    // const query = { price: { $type: "number" } };
    // const query = { price: { $type: "string" } };
    // const query = { price: { $type: "object" } };
    // const query = { price: { $type: "array" } };
    // const query = { price: { $type: "null" } };
    // const query = { price: { $type: "boolean" } };
    // const query = { price: { $type: "date" } };
    // const query = { price: { $type: "timestamp" } };
    // const query = { price: { $type: "regex" } };
    // const query = { price: { $mod: [2, 0] } };
    // const query = { price: { $mod: [2, 1] } };
    // const query = { price: { $mod: [3, 0] } };
    // const query = { price: { $mod: [3, 1] } };
    // const query = { price: { $mod: [3, 2] } };
    // const query = { $and: [{ price: { $gt: 20 } }, { price: { lt: 100 } }] };
    // const query = { $or: [{ price: { $gt: 20 } }, { price: { lt: 100 } }] };
    let search = req.query.search;
    let query = {};

    // serch by title

    if (search.length) {
      query = {
        $text: { $search: search },
      };
    }

    const cursor = serviceCollection.find(query).sort({ price: order });
    const services = await cursor.toArray();
    res.send({
      success: true,
      message: "Successfully got the data",
      data: services,
    });
  } catch (error) {
    console.log(error.name.bgRed, error.message.bold);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

app.get("/services/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const service = await serviceCollection.findOne({ _id: ObjectId(id) });
    res.send({
      success: true,
      message: "Successfully got the data",
      data: service,
    });
  } catch (error) {
    console.log(error.name.bgRed, error.message.bold);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

// post

app.post("/jwt", (req, res) => {
  try {
    const user = req.body;
    const token = jwt.sign(user, process.env.MAIN_JWT_SECRIPT_KEY);

    res.send({
      success: true,
      message: "Successfully got the data from jwt",
      token,
    });
  } catch (error) {
    console.log(error.name.bgRed, error.message.bold);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

//=========================Add Order=============================

app.post("/addOrder", async (req, res) => {
  const order = req.body;
  try {
    const result = await orderCollection.insertOne(order);
    res.send({
      success: true,
      message: "Successfully added the order",
      data: result,
    });
  } catch (error) {
    console.log(error.name.bgRed, error.message.bold);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

app.get("/orders", verifyTokenJwt, async (req, res) => {
  try {
    console.log(req.headers.authorization);
    const decoded = req.decoded;
    // console.log(decoded, "in orders");
    if (decoded.email !== req.query.email) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized access",
      });
    }

    let query = {};
    if (req.query.email) {
      query.email = req.query.email;
    }
    const cursor = orderCollection.find(query);
    const orders = await cursor.toArray();
    res.send(orders);
  } catch (error) {
    console.log(error.name.bgRed, error.message.bold);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

app.delete("/deleteOrder/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await orderCollection.deleteOne({ _id: ObjectId(id) });
    res.send({
      success: true,
      message: "Successfully deleted the order",
      data: result,
    });
  } catch (error) {
    console.log(error.name.bgRed, error.message.bold);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

app.patch("/updateOrder/:id", async (req, res) => {
  const id = req.params.id;
  // const order = req.body;
  const status = req.body.status;
  try {
    // const result = await orderCollection.updateOne(
    //   { _id: ObjectId(id) },
    //   { $set: (status = order.status) }
    // );

    const uodateOrder = {
      $set: {
        status: status,
      },
    };
    const result = await orderCollection.updateOne(
      { _id: ObjectId(id) },
      uodateOrder
    );

    res.send({
      success: true,
      message: "Successfully updated the order",
      data: result,
    });
  } catch (error) {
    console.log(error.name.bgRed, error.message.bold);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

/// ========================= DB Connection =========================

///========================= Midils Wares =========================

///========================= Midils Wares =========================

app.listen(port, () => {
  console.log(`Car Docter Server Is Runing  ${port}`.blue.bold);
});
