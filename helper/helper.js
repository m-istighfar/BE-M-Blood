const mongoose = require("mongoose");
const faker = require("faker");
const User = require("../models/User");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const LearningPath = require("../models/learningpath");
const Progress = require("../models/progress");
const bcrypt = require("bcrypt");

async function generateFakeUsers(count) {
  const fakeUsers = [];

  for (let i = 0; i < count - 1; i++) {
    const password = "123456";
    const hashedPassword = await bcrypt.hash(password, 10);

    const fakeUser = {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: hashedPassword,
      role: faker.random.arrayElement(["author", "student"]),
      verified: true,
    };
    fakeUsers.push(fakeUser);
  }

  const adminPassword = "123456";
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = {
    username: "admin",
    email: "admin@example.com",
    password: hashedAdminPassword,
    role: "admin",
    verified: true,
  };
  fakeUsers.push(adminUser);

  try {
    const savedUsers = await User.insertMany(fakeUsers);
    console.log(`${count} fake users inserted into the database.`);
    return savedUsers;
  } catch (error) {
    console.error("Error inserting fake users:", error);
  }
}

async function generateFakeCourses(count, users) {
  const authorUsers = users.filter((user) => user.role === "author");
  const studentUsers = users.filter((user) => user.role === "student");

  if (!authorUsers.length || !studentUsers.length) {
    console.error("No authors or students available for course creation.");
    return;
  }

  const fakeCourses = [];

  for (let i = 0; i < count; i++) {
    const { reviews, ratingAverage } = generateFakeReviews(studentUsers);
    const fakeCourse = {
      title: faker.lorem.words(3),
      description: faker.lorem.paragraph(),
      thumbnail: faker.image.imageUrl(),
      authorId: faker.random.arrayElement(authorUsers)._id,
      creationDate: faker.date.past(),
      reviews,
      ratingAverage,
    };
    fakeCourses.push(fakeCourse);
  }

  try {
    const savedCourses = await Course.insertMany(fakeCourses);
    console.log(`${count} fake courses inserted into the database.`);
    return savedCourses;
  } catch (error) {
    console.error("Error inserting fake courses:", error);
    return null;
  }
}

function generateFakeReviews(students) {
  const numReviews = faker.random.number({ min: 0, max: 10 });
  const reviews = [];
  let totalRating = 0;

  for (let i = 0; i < numReviews; i++) {
    const rating = faker.random.number({ min: 1, max: 5 });
    const review = {
      studentId: faker.random.arrayElement(students)._id,
      rating: rating,
      review: faker.lorem.paragraph(),
    };
    totalRating += rating;
    reviews.push(review);
  }

  const ratingAverage =
    numReviews > 0 ? (totalRating / numReviews).toFixed(2) : 0;

  return {
    reviews,
    ratingAverage,
  };
}

async function generateFakeEnrollments(courses, users) {
  const studentUsers = users.filter((user) => user.role === "student");
  const fakeEnrollments = [];
  const uniquePairs = new Set();

  courses.forEach((course) => {
    const numEnrollments = faker.random.number({
      min: 0,
      max: studentUsers.length,
    });

    for (let i = 0; i < numEnrollments; i++) {
      const studentId = faker.random.arrayElement(studentUsers)._id;
      const uniqueKey = `${course._id}-${studentId}`;

      if (uniquePairs.has(uniqueKey)) continue;

      uniquePairs.add(uniqueKey);

      const fakeEnrollment = {
        courseId: course._id,
        studentId,
        status: faker.random.arrayElement(["accepted", "rejected", "pending"]),
      };

      fakeEnrollments.push(fakeEnrollment);
    }
  });

  try {
    const savedEnrollments = await Enrollment.insertMany(fakeEnrollments);
    console.log(
      `${savedEnrollments.length} fake enrollments inserted into the database.`
    );
    return savedEnrollments;
  } catch (error) {
    console.error("Error inserting fake enrollments:", error);
  }
}

async function generateFakeLearningPaths(courses) {
  const fakeLearningPaths = [];

  for (let i = 0; i < 5; i++) {
    const courseCount = faker.random.number({ min: 1, max: 3 });
    const selectedCourses = faker.helpers
      .shuffle(courses)
      .slice(0, courseCount);

    const fakeLearningPath = {
      title: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      courses: selectedCourses.map((course) => course._id),
    };

    fakeLearningPaths.push(fakeLearningPath);
  }

  try {
    const savedLearningPaths = await LearningPath.insertMany(fakeLearningPaths);
    console.log(
      `${savedLearningPaths.length} fake learning paths inserted into the database.`
    );
    return savedLearningPaths;
  } catch (error) {
    console.error("Error inserting fake learning paths:", error);
  }
}

async function generateFakeProgressRecords(courses, users) {
  const fakeProgressRecords = [];
  const studentUsers = users.filter((user) => user.role === "student");

  courses.forEach((course) => {
    studentUsers.forEach((student) => {
      const fakeProgressRecord = {
        studentId: student._id,
        courseId: course._id,
        completion: faker.random.number({ min: 0, max: 100 }),
      };
      fakeProgressRecords.push(fakeProgressRecord);
    });
  });

  try {
    const savedProgressRecords = await Progress.insertMany(fakeProgressRecords);
    console.log(
      `${savedProgressRecords.length} fake progress records inserted into the database.`
    );
    return savedProgressRecords;
  } catch (error) {
    console.error("Error inserting fake progress records:", error);
  }
}

module.exports = {
  generateFakeUsers,
  generateFakeCourses,
  generateFakeEnrollments,
  generateFakeLearningPaths,
  generateFakeProgressRecords,
};
