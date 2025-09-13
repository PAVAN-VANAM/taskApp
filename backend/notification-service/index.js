
const amqp = require('amqplib')

let channel , connection;

async function start() {
    try {
      connection = await amqp.connect("amqp://guest:guest@rabbitmq:5672");
      channel = await connection.createChannel();
      await channel.assertQueue("task_created");
      console.log("Notification service is listening the messages");
      
      channel.consume("task_created",(msg)=>{
        const taskData  = JSON.parse(msg.content.toString());
        console.log("Notification : NEW TASK ADDED : ", taskData.title);
        console.log(taskData);
        channel.ack(msg);
      });

    } catch (error) {
      console.error("RabbitMQ Connection Error :",error.message);
     
    }
  }

start();