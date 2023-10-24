const mongoose = require("mongoose");

async function clearDatabase() {
  const collections = mongoose.connection.collections;

  for (const collectionName in collections) {
    const collection = collections[collectionName];
    await collection.deleteMany({});
  }
}

module.exports = clearDatabase;
