# JobTracker

Job application tracking system built with the MERN stack (MongoDB, Express, React, Node.js).

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)

## Setup

1. **Install Root Dependencies:**

   ```bash
   npm install
   ```

2. **Install Client Dependencies:**

   ```bash
   cd client
   npm install
   cd ..
   ```

3. **Configure Environment Variables:**

   Create a `.env` file in the root directory based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

   Fill in your `MONGO_URI`, `JWT_SECRET`, and other configuration details.

## Running the Application

### Development (Both Client & Server)

To run both the server and the Vite client simultaneously:

```bash
npm run dev
```

### Individual Components

- **Run Server Only:**

  ```bash
  npm run server
  ```

- **Run Client Only:**

  ```bash
  npm run client
  ```

## Project Structure

- `/client`: React + Vite frontend
- `/server`: Node.js + Express backend
- `/public`: Static assets
