const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const User = require("./models/user");
const auth = require("./middleware/auth");
const products = require("./data/product");

const path = require("path");
const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));


const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect("mongodb+srv://lay:Lay1711@cluster0.crjdsgb.mongodb.net/posdb?appName=Cluster0")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ----------------------- AUTH ROUTES -----------------------
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & password required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashed,
      name,
    });

    res.json({ message: "User registered", userId: user._id });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, "SECRET_KEY_123", {
      expiresIn: "1d",
    });

    res.json({
      message: "Login success",
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------- PRODUCT API -----------------------
app.get("/products", auth, (req, res) => {
  res.json(products);
});

// ------------------------------------------------------------
app.listen(3000, () => console.log("Server running at http://localhost:3000"));
