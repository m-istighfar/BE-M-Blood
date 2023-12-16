const { PrismaClient } = require("@prisma/client");
const faker = require("faker");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function seed() {
  try {
    const hashedPassword = await bcrypt.hash("123456", 10);

    const userAuths = [];
    for (let i = 0; i < 10; i++) {
      const timestamp = Date.now();
      userAuths.push({
        Username: `${faker.internet.userName()}_${i}_${timestamp}`,
        Email: `${i}_${timestamp}@example.com`,
        Password: hashedPassword,
        Role: faker.random.arrayElement(["admin", "user"]),
        Verified: true,
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      });
    }

    const validProvinceIds = [
      11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 31, 32, 33, 34, 35, 36, 51, 52,
      53, 61, 62, 63, 64, 65, 71, 72, 73, 74, 75, 76, 81, 82, 91, 94,
    ];

    const users = [];
    for (let i = 0; i < 20; i++) {
      users.push({
        ProvinceID: faker.random.arrayElement(validProvinceIds),
        Name: faker.name.findName(),
        Phone: faker.phone.phoneNumber(),
        Email: faker.internet.email(),
        AdditionalInfo: faker.lorem.sentence(),
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      });
    }

    await prisma.userAuth.createMany({ data: userAuths });
    await prisma.user.createMany({ data: users });

    const createdUsers = await prisma.user.findMany();
    const userIds = createdUsers.map((user) => user.UserID);

    const bloodTypes = await prisma.bloodType.findMany();

    const appointments = [];
    for (let i = 0; i < 30; i++) {
      const randomUserId = faker.random.arrayElement(userIds);
      const randomBloodType = faker.random.arrayElement(bloodTypes);
      appointments.push({
        UserID: randomUserId,
        BloodTypeID: randomBloodType.BloodTypeID,
        ScheduledDate: faker.date.future(),
        Location: faker.address.streetAddress(),
        Status: faker.random.arrayElement([
          "scheduled",
          "completed",
          "cancelled",
          "rescheduled",
        ]),
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      });
    }

    const emergencyRequests = [];
    for (let i = 0; i < 30; i++) {
      const randomUserId = faker.random.arrayElement(userIds);
      const randomBloodType = faker.random.arrayElement(bloodTypes);
      emergencyRequests.push({
        UserID: randomUserId,
        BloodTypeID: randomBloodType.BloodTypeID,
        RequestDate: faker.date.past(),
        Location: faker.address.streetAddress(),
        Status: faker.random.arrayElement([
          "pending",
          "inProgress",
          "fulfilled",
          "expired",
          "cancelled",
        ]),
        AdditionalInfo: faker.lorem.sentence(),
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      });
    }
    const helpOffers = [];
    for (let i = 0; i < 20; i++) {
      const randomUserId = faker.random.arrayElement(userIds);
      const randomBloodType = faker.random.arrayElement(bloodTypes);
      helpOffers.push({
        UserID: randomUserId,
        BloodTypeID: randomBloodType.BloodTypeID,
        IsWillingToDonate: faker.random.boolean(),
        CanHelpInEmergency: faker.random.boolean(),
        Location: faker.address.streetAddress(),
        Reason: faker.lorem.sentence(),
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      });
    }

    const bloodDrives = [];
    for (let i = 0; i < 15; i++) {
      const randomUserId = faker.random.arrayElement(userIds);
      bloodDrives.push({
        UserID: randomUserId,
        Institute: faker.company.companyName(),
        ProvinceID: faker.random.arrayElement(validProvinceIds),
        Designation: faker.lorem.words(),
        ScheduledDate: faker.date.future(),
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      });
    }

    const bloodInventories = [];
    for (let i = 1; i <= 8; i++) {
      bloodInventories.push({
        BloodTypeID: i,
        Quantity: faker.random.number({ min: 1, max: 100 }),
        ExpiryDate: faker.date.future(),
        ProvinceID: faker.random.arrayElement(validProvinceIds),
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      });
    }

    await prisma.appointment.createMany({ data: appointments });
    await prisma.emergencyRequest.createMany({ data: emergencyRequests });
    await prisma.helpOffer.createMany({ data: helpOffers });
    await prisma.bloodDrive.createMany({ data: bloodDrives });
    await prisma.bloodInventory.createMany({ data: bloodInventories });

    console.log("Seed data created successfully.");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
