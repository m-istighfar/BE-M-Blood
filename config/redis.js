const Redis = require("ioredis");

// const redisConfig = {
//   host: "localhost",
//   port: 6379,
// };

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
};
const redis = new Redis(redisConfig);

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

redis.ping((err, result) => {
  if (err) {
    console.error("Tidak dapat terhubung ke Redis:", err);
  } else {
    console.log("Koneksi Redis berhasil:", result);
  }
});

module.exports = redis;
