const express = require("express");
const mongoose = require("mongoose");
const amqp= require('amqplib');
const app = express();
const PORT = 5001;

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
    "mongodb://mongo:27017/tasks"
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });



// schema
const TaskSchema = new mongoose.Schema({
    title:String,
    description : String,
    userId :String,
    createdAt : {
        type : Date,
        default : Date.now
    }
});

// model
const Task = mongoose.model("Task", TaskSchema);


//creating queue using Rabbit MQ
let channel , connection;

async function connectRabbitMQWithRetry(retries = 5 , delay =3000) {
  
  while(retries){
    try {
      connection = await amqp.connect("amqp://guest:guest@rabbitmq:5672");
      channel = await connection.createChannel();
      await channel.assertQueue("task_created");
      console.log("Connected to RabbitMQ");
      return;
    } catch (error) {
      console.error("RabbitMQ Connection Error :",error.message);
      retries--;
      console.error("Retrying Again :",retries);
      await new Promise(res=> setTimeout(res,delay));
      
    }
  }
}



// Routes
app.post("/task/create", async (req, res) => {
  const { title , description, userId } = req.body;
  try {
    const newTask = new Task({ title , description , userId });
    await newTask.save();

    const message = {taskID : newTask._id , title : title}
    if(!channel){
      return res.status(503).json({error : "RabbitMq not connected"});
    }

    channel.sendToQueue("task_created", Buffer.from(JSON.stringify(message)));

    res
      .status(201)
      .json({ message: "Task Created successfully", data: newTask });
  } catch (error) {
    res.status(500).json({ message: "Error create tasks", error });
  }
});

// get tasks by userId
app.get("/:userId/tasks",async(req,res)=>{
    try {
    const { userId } = req.params;
    const tasks = await Task.find({ userId });
    res.json({ userId, tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sample route
app.get("/", (req, res) => {
  res.send("Task Service is running");
});

app.listen(PORT, async() => {
  console.log(`Task Service is running on http://localhost:${PORT}`);
  await connectRabbitMQWithRetry();
});

