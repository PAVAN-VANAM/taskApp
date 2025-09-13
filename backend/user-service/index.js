const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection for Local running purpose
// mongoose
//   .connect(
//     "mongodb://localhost:27017/users"
//   )
//   .then(() => {
//     console.log("Connected to MongoDB");
//   })
//   .catch((err) => {
//     console.error("Failed to connect to MongoDB", err);
//   });


// docker mongodb container connection
mongoose
  .connect(
    "mongodb://mongo:27017/users"
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });



// schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

// model
const User = mongoose.model("User", UserSchema);

// Routes
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const newUser = new User({ name, email, password });
    await newUser.save();
    res
      .status(201)
      .json({ message: "User registered successfully", data: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
});

// get all users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});

// get by id or email
app.get("/user", async (req, res) => {
  const { id, email } = req.query;
  try {
    const user = id ? await User.findById(id) : await User.findOne({ email });
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (user) {
      res.status(200).json({ message: "Login successful", user });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "User Service is healthy" });
});

// Sample route
app.get("/", (req, res) => {
  res.send("User Service is running");
});

app.listen(PORT, () => {
  console.log(`User Service is running on http://localhost:${PORT}`);
});

