const mongoose = require("mongoose");
const faker = require("faker");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Task = require("../models/Task");

async function generateFakeUsers(count) {
  const fakeUsers = [];
  const defaultPassword = "12345678"; // Set default password

  for (let i = 0; i < count; i++) {
    const hashedPassword = await bcrypt.hash(defaultPassword, 10); // Hash the default password

    const fakeUser = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: hashedPassword,
      role: faker.random.arrayElement(["admin", "user"]),
      verified: faker.random.boolean(),
      verificationToken: faker.random.uuid(),
      googleId: faker.random.uuid(),
    };
    fakeUsers.push(fakeUser);
  }

  try {
    const savedUsers = await User.insertMany(fakeUsers);
    console.log(`${savedUsers.length} fake users inserted into the database.`);
    return savedUsers;
  } catch (error) {
    console.error("Error inserting fake users:", error);
  }
}

async function generateFakeTasks(count, users) {
  const fakeTasks = [];

  for (let i = 0; i < count; i++) {
    const fakeTask = {
      title: faker.lorem.words(),
      description: faker.lorem.paragraph(),
      priority: faker.random.arrayElement(["high", "medium", "low"]),
      dueDate: faker.date.future(),
      userId: faker.random.arrayElement(users)._id,
    };
    fakeTasks.push(fakeTask);
  }

  try {
    const savedTasks = await Task.insertMany(fakeTasks);
    console.log(`${savedTasks.length} fake tasks inserted into the database.`);
    return savedTasks;
  } catch (error) {
    console.error("Error inserting fake tasks:", error);
  }
}

module.exports = {
  generateFakeUsers,
  generateFakeTasks,
};
