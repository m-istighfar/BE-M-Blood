# Blood Donation Web Application Backend

## Live Demo

 [Netlify](https://tubular-pothos-13218a.netlify.app)
 [Vercel] (https://fe-final-project-revou.vercel.app/)

## Introduction

This repository is home to the backend services of a robust Blood Donation Web Application designed to streamline the process of donating blood and managing blood bank inventories. This README outlines the architectural design, database relationships, and application flow to provide contributors and stakeholders with a comprehensive understanding of the backend system.

## System Architecture

The backend is structured to handle HTTP requests from the React-based frontend and serves as the intermediary between the frontend and our PostgreSQL database. Key components include:

- **Express.js**: The core framework that handles HTTP requests and routes them to the appropriate services.
- **Prisma ORM**: Manages our interactions with the PostgreSQL database, ensuring efficient querying and data management.
- **ioredis**: Implements caching for performance optimization.
- **Midtrans and Twilio**: Integrated for payment processing and WhatsApp services, respectively.

![Backend Architecture Diagram](/asset/images/Artitektur%20Website.png)

## Database Design

Our PostgreSQL database is the backbone of the application, storing all critical data. Prisma ORM is used to define and migrate our database schema, which is designed to efficiently manage the relationships between entities such as donors, recipients, blood drives, and donations.

![Entity Relationship Diagram](/asset/images/Database%20Schema.png)

## Application Flow

The application flow diagram provides a visual guide to the user journey through the application, from account creation to the management of blood donation events and emergency requests.

![Application Flow Diagram](/asset/images/Flow%20Aplikasi.png)

## Features

- **Account Management**: Sign-up, login, and password management.
- **Donation Management**: Scheduling donations, managing blood drives, and emergency blood requests.
- **Notifications**: Automated WhatsApp and email notifications for reminders and alerts.
- **Payment Processing**: Secure handling of financial transactions for donations.
- **Data Reporting**: Admin dashboard for real-time data on blood stocks and donation activities.

## Getting Started

### Prerequisites

- Node.js (v12 or higher)
- PostgreSQL
- Redis

### Setup Instructions

1. Clone the repository: `git clone [repository_url]`
2. Install dependencies: `npm install`
3. Configure environment variables in `.env`
4. Migrate the database: `npx prisma migrate dev`
5. Start the server: `npm run dev`

## Usage

Once the server is running, it will handle requests based on the defined routes and controllers. Frontend developers can use the provided API documentation to understand how to interact with the backend services.

## API Documentation 

## Postman Collection

[Postman Collection](https://documenter.getpostman.com/view/28996754/2s9YkjAPGE#0b7a547e-cfbc-4da9-b027-b45b25908783)

Detailed API documentation is available in the `doc` directory, which includes OpenAPI specifications for the available endpoints