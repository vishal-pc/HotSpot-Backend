# Radar-backend 
Radaar Backend is the server-side component of a location-based dating application. Built with Node.js, this project uses Express for server handling, Mongoose for MongoDB interactions, and Redis for caching and session management.

# Features
User authentication and profile management

Real-time chat using Socket.IO

Location tracking and proximity-based user matching

Email and push notifications

Secure payment processing with Stripe

# Prerequisites
Node.js

MongoDB

Redis

# Installation

Clone the repository:

git clone https://github.com/technocratshorizons/Radaar-backend

cd Radaar-backend

Install dependencies:

npm install

# Configuration
Create a .env file in the root directory and add the following environment variables:


# Running the Application
To run the application in development mode:

npm run dev

To build the application:

npm run build

To start the application:

npm start

# Redis Setup
Ensure Redis is installed and running on your local machine or a remote server. Update the REDIS_HOST and REDIS_PORT in your .env file to point to your Redis instance.

# Making Build Live

Push the code to main branch

Login to the server with ssh and password

Ones logged in go to Radar-backend folder and run git pull their

Ones the latest changes are fetched run sudo docker compose up --build -d

# Contributing
Contributions are welcome. Please fork the repository and submit a pull request.


