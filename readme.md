# Simple E-Learning Platform

## Overview

This is a simple e-learning platform consisting of a backend API built with Node.js and Express, and a frontend developed using React and Tailwind CSS. The platform focuses on providing different functionalities for users with different roles, such as Admin, Author, and Student. Features include user authentication and authorization, course management, learning path management, and a feature-rich dashboard for admins, authors, and students. The frontend of this application is deployed on Firebase.

## Live Deployment

- [Firebase Web App](https://week-17-tifar.web.app/)


## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Database Setup and Schema](#database-setup-and-schema)
- [Database Relationships](#database-relationships)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Testing and Faker.js Integration](#testing-and-fakerjs-integration)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Key Features

### General

- **JWT-based Authentication**: Securely authenticate users via JWT.
- **Role-based Authorization**: Middleware to enable role-based access.
- **API Documentation**: Swagger UI for API documentation.
- **Login & Logout Routes**: Users can log in, receive tokens and refresh tokens, and also log out, which clears the session.
- **Login Session Management**: The application maintains user sessions and handles tokens using cookies.
- **Account Security Features**:
  - **Password Reset**: If users forget their password, they can request a reset link and update their password following best practices.
  - **Login Limitation**: To prevent brute force attacks, after 5 failed login attempts, the response is negative.
  - **Account Lockout**: After 5 failed login attempts, the user's account (identified by email/username) will be locked out for a specific duration, regardless of the IP address used.
  - **Blacklisted Tokens**: Access tokens can be blacklisted to revoke their validity. This ensures that upon logout, the token is immediately invalidated.
  - **Middleware Checks**: Middleware will verify if an access token is revoked and will deny authentication accordingly.
  - **Google SSO**: Users have the option to sign up and sign in using Google's Single Sign-On (SSO) feature.

### For Administrators

- **User Management**: Ability to create, update, and delete users.
- **Role Assignment**: Ability to assign roles to users.
- **Course Management**: Endpoints to create, update, and delete courses.
- **Learning Paths**: Creation and management of learning paths.
- **Admin Dashboard**: Overview of system-wide metrics.

### For Authors

- **Own Course Management**: Create, update, and delete courses that they have authored.
- **Enrollment Management**: View and manage student enrollment requests, but only for courses they have authored.
- **Author Dashboard**: Metrics related to engagement with courses they have authored.
- **Learning Path Integration**: Add courses to existing learning paths, but cannot create or delete learning paths.

  **Note**: Authors can only manage courses that they have personally authored.

### For Students

- **Course Discovery**: Browse and view available courses.
- **Enrollment Management**:
  - **Send Enrollment Requests**: Apply for enrollment in courses.
  - **View Accepted Enrollments**: Check the status of enrollment requests and see which have been accepted.
  - **Unenroll**: Option to unenroll from courses.
- **Progress Tracking**: Monitor course completion and progress.
- **Student Dashboard**: View enrolled courses, progress, and more.
- **Course Reviews**: Add reviews and ratings to courses they have completed.

  **Note**: Students can only see enrollments that have been accepted and have the option to unenroll.



## Tech Stack

**Server & Middleware:**
1. **express (v4.18.2)**: A web application framework for Node.js, used for building web apps and APIs.
2. **body-parser (v1.20.2)**: Middleware to parse incoming request bodies. This has been part of Express.js itself for some time and is no longer necessary as a separate dependency.
3. **cookie-parser (v1.4.6)**: Middleware to parse cookies.
4. **cors (v2.8.5)**: Middleware to enable CORS (Cross-Origin Resource Sharing).

**View Engine:**
1. **ejs (v3.1.9)**: A templating engine for rendering views in Express.js.

**Authentication & Security:**
1. **bcrypt (v5.1.1)**: For hashing passwords.
2. **jsonwebtoken (v9.0.1)**: For generating and validating JSON web tokens.
3. **passport (v0.6.0)**: Authentication middleware.
4. **passport-google-oauth20 (v2.0.0)**: Passport strategy for authenticating with Google using OAuth 2.0.
5. **express-session (v1.17.3)**: For managing user sessions.
6. **express-rate-limit (v7.1.1)**: Rate limiter to protect your application from brute-force attacks.

**Database & Caching:**
1. **mongoose (v7.4.5)**: ORM for MongoDB, allowing for easy integration with your Express.js application.
2. **memory-cache (v0.2.0)**: A simple in-memory cache.

**Email Service:**
1. **nodemailer (v6.9.6)**: Send emails with Node.js.

**Utilities & Misc:**
1. **crypto (v1.0.1)**: Core module in Node.js for cryptographic functionality. Note that you might not need this as an explicit dependency since it's a built-in module in Node.js.
2. **dotenv (v16.3.1)**: Loads environment variables from a `.env` file.
3. **faker (v5.5.3)**: For generating fake data.
4. **swagger-ui-express (v5.0.0)**: Allows you to serve the Swagger UI, which lets you visualize and interact with your API’s resources.
5. **yaml (v2.3.2)**: For working with YAML data format.

**Development Dependencies:**
1. **@faker-js/faker (v8.0.2)**: This seems to be a newer version or a different package of faker. You might want to consolidate to one version/package.

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/RevoU-FSSE-2/week-11-m-istighfar.git
```

### Step 2: Navigate to Project Folder

```bash
cd learning-platform-api
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Environment Setup

Create a `.env` file:

```env
PORT=3000
DATABASE_URL=mongodb://localhost:27017/learning_platform
JWT_SIGN=your-access-token-secret-key
JWT_REFRESH_SIGN=your-refresh-token-secret-key
ACCESS_TOKEN_EXPIRATION="10m"
REFRESH_TOKEN_EXPIRATION="7d"
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### Step 5: Start the Server

```bash
npm start
```

Visit `http://localhost:3000/api-docs` for API documentation.

## Environment Variables

| Variable       | Description                          |
| -------------- | ------------------------------------ |
| `PORT`         | The port number to run the server on |
| `DATABASE_URL` | MongoDB connection string            |
| `JWT_SECRET`   | Secret key for JSON Web Token        |

## Testing and Faker.js Integration

For generating mock data during testing or development, this project is integrated with [Faker.js](https://github.com/Marak/Faker.js). Faker.js allows you to generate a whole bunch of fake data for testing, seeding databases, and more.

### Installing Faker.js

If you haven't already installed Faker.js, you can add it to your project by running:

```bash
npm install faker --save-dev
```

### How to Run the Faker.js Script

#### Step 1: Navigate to the Project Folder

```bash
cd learning-platform-api
```

#### Step 2: Run the Faker.js Script

To run the Faker.js script and populate your MongoDB database with mock data, execute the following command:

```bash
node .\helper\generateFakeData.js
```

## API Endpoints

### **Authentication Endpoints**

| Method | Endpoint                     | Description                            |
| ------ | ---------------------------- | -------------------------------------- |
| POST   | `/auth/register`             | User Registration                      |
| POST   | `/auth/login`                | User Login with Rate Limit             |
| POST   | `/auth/login-session`        | User Login with Session and Rate Limit |
| GET    | `/auth/verify-email/:token`  | Email Verification                     |
| POST   | `/auth/refreshToken`         | Refresh Token Handler                  |
| POST   | `/auth/logout-session`       | User Logout with Session               |
| POST   | `/auth/request-password-reset` | Request Password Reset               |
| POST   | `/auth/reset-password/:resetToken` | Reset Password using Token         |
| GET    | `/auth/rate-limit-data`      | Fetch rate-limit data for users        |
| POST   | `/auth/rate-limit-reset/:key`| Reset rate limit for a specific key    |
| POST   | `/auth/rate-limit-reset-all` | Reset rate limits for all users        |
| GET    | `/auth/cache-data`           | Get cache data                         |
| GET    | `/auth/google`               | Google OAuth authentication route      |
| GET    | `/auth/google/callback`      | Callback for Google OAuth              |


### **Admin Endpoints**

| Method | Endpoint                                | Description                          |
| ------ | --------------------------------------- | ------------------------------------ |
| POST   | `/admin/createUser`                     | Create a new user                    |
| PUT    | `/admin/updateUser/:id`                 | Update a user's details              |
| DELETE | `/admin/deleteUser/:id`                 | Delete a user                        |
| GET    | `/admin/listUsers`                      | List all users                       |
| POST   | `/admin/assignRole/`                    | Assign a role to a user              |
| POST   | `/admin/createCourse`                   | Create a new course                  |
| PUT    | `/admin/updateCourse/:id`               | Update a course                      |
| DELETE | `/admin/deleteCourse/:id`               | Delete a course                      |
| GET    | `/admin/listCourses`                    | List all courses                     |
| GET    | `/admin/dashboard`                      | Get admin dashboard data             |
| POST   | `/admin/createLearningPath`             | Create a new learning path           |
| GET    | `/admin/listLearningPaths`              | List all learning paths              |
| PUT    | `/admin/updateLearningPath/:id`         | Update a learning path               |
| DELETE | `/admin/deleteLearningPath/:id`         | Delete a learning path               |
| POST   | `/admin/addCourse`                      | Add a course to a learning path      |
| DELETE | `/admin/deleteCourse/:pathId/:courseId` | Delete a course from a learning path |

### **Author Endpoints**

| Method | Endpoint                                         | Description                            |
| ------ | ------------------------------------------------ | -------------------------------------- |
| POST   | `/author/createCourse`                           | Create a new course                    |
| GET    | `/author/listCourses`                            | List all courses                       |
| PUT    | `/author/updateOwnedCourse/:id`                  | Update an owned course                 |
| DELETE | `/author/deleteOwnedCourse/:id`                  | Delete an owned course                 |
| GET    | `/author/listEnrollRequests`                     | List all enroll requests               |
| POST   | `/author/updateEnrollmentStatus/:requestId`      | Update the status of an enroll request |
| PUT    | `/author/updateProfile`                          | Update author profile                  |
| GET    | `/author/listowncourses`                         | List own courses                       |
| GET    | `/author/dashboard`                              | Get author dashboard data              |
| GET    | `/author/listLearningPaths`                      | List all learning paths                |
| POST   | `/author/addCoursetoPath`                        | Add a course to a learning path        |
| DELETE | `/author/deleteCoursefromPath/:pathId/:courseId` | Delete a course from a learning path   |

### **Student Endpoints**

| Method | Endpoint                             | Description                        |
| ------ | ------------------------------------ | ---------------------------------- |
| GET    | `/student/viewcourse`                | List all courses                   |
| POST   | `/student/sendEnrollRequest`         | Send an enrollment request         |
| GET    | `/student/readEnrolledCourseContent` | Read content of an enrolled course |
| POST   | `/student/unenrollFromCourse`        | Unenroll from a course             |
| POST   | `/student/markCourseCompleted`       | Mark a course as completed         |
| PUT    | `/student/updateProfile`             | Update student profile             |
| POST   | `/student/addReview/:courseId`       | Add a review for a course          |
| GET    | `/student/dashboard`                 | Get student dashboard data         |
| GET    | `/student/progress/:courseId`        | Get progress for a course          |
| PUT    | `/student/progress/:courseId`        | Update progress for a course       |

For a complete list of API Endpoints and their descriptions, please check the Swagger documentation at `/api-docs`.

## Contributing

Contributions are welcome. Please follow the standard Git workflow:

1. Fork the repository.
2. Create a new branch.
3. Add your features or bug fixes.
4. Create a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
