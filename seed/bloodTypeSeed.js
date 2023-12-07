const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  for (const type of bloodTypes) {
    await prisma.bloodType.create({
      data: { Type: type },
    });
  }
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
