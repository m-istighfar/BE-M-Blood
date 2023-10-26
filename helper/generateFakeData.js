const mongoose = require("mongoose");
const { generateFakeUsers, generateFakeTasks } = require("../helper/helper");
require("dotenv").config();

const DB_URL = process.env.DB_URL;

const clearDatabase = require("./clearDatabase");

async function generateFakeData() {
  try {
    mongoose.connect(`${DB_URL}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await clearDatabase();

    const numFakeUsers = 20;
    const users = await generateFakeUsers(numFakeUsers);

    const tasksPerUser = 9;
    const taskPromises = users.map(() =>
      generateFakeTasks(tasksPerUser, users)
    );
    await Promise.all(taskPromises);

    console.log("Fake data generation completed.");
  } catch (error) {
    console.error("Error generating fake data:", error);
  } finally {
    mongoose.connection.close();
  }
}

generateFakeData();

module.exports = generateFakeData;
