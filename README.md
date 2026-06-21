# Trao AI Travel Planner

A secure, multi-user, responsive web application where users can create, customize, and save interactive travel itineraries powered by Google Gemini AI. The application dynamically generates structured day-by-day itineraries, estimates budgets, suggests hotels, permits real-time timeline editing (adding/removing activities and regenerating specific days), and features an AI Weather-Aware Packing Assistant with interactive checklists.

---

## Architecture & Monorepo Structure

The project is structured as a monorepo consisting of a separate Express.js REST API backend and a Next.js App Router frontend:

```text
AI Travel Planner/
├── backend/
│   ├── config/            # Database connection handlers (db.js)
│   ├── controllers/       # Route controllers (authController, tripController)
│   ├── middleware/        # JWT security enforcement (auth.js)
│   ├── models/            # Mongoose schemas (User, Trip)
│   ├── routes/            # Express route maps (authRoutes, tripRoutes)
│   ├── server.js          # API server entrypoint
│   └── test-api.js        # Backend integration verification suite
└── frontend/
    ├── src/
    │   ├── app/           # Next.js App Router pages (landing, login, register, dashboard)
    │   ├── components/    # Reusable UI widgets (CreateTripForm, etc.)
    │   └── utils/         # Network helper clients (api.ts)
    ├── package.json       # Frontend project manifests
    └── tailwind.config.ts # Global theme settings
```

---

## Technical Stack

*   **Frontend**: Next.js 15 (App Router, Webpack configuration), React, Tailwind CSS, Lucide React (icons), Outfit/Inter typography.
*   **Backend**: Node.js, Express.js.
*   **Database**: MongoDB + Mongoose ODM.
*   **AI Engine**: Google Gemini API (`gemini-2.5-flash` model for structured JSON schemas).
*   **Authentication**: JSON Web Tokens (JWT) + BcryptJS password hashing.

---

## Security & User Data Isolation

Data isolation is built directly into the database query layer. Every trip query and modification is restricted by the user ID extracted from the verified JWT:
1. When a user requests trips or updates an itinerary, the `auth.js` middleware extracts and verifies the bearer token.
2. The user ID (`req.user.id`) is injected into the Mongoose query criteria (e.g. `Trip.findOne({ _id: req.params.id, userId: req.user.id })`).
3. This ensures that even if User B attempts to view or modify User A's `tripId`, the database query will return `null` (`404 Not Found`), completely eliminating any risk of cross-account data exposure.

---

## LLM Gemini Integration Schema Design

We leverage Gemini's structured output capability. When a user requests an itinerary, the backend sends a query to the Gemini API requesting a response conforming strictly to the following JSON schema:

```json
{
  "destination": "String",
  "durationDays": "Number",
  "budgetTier": "Low | Medium | High",
  "estimatedBudget": {
    "total": "Number",
    "accommodation": "Number",
    "activities": "Number",
    "food": "Number",
    "transport": "Number"
  },
  "hotels": [
    {
      "name": "String",
      "description": "String",
      "priceRange": "String",
      "rating": "Number"
    }
  ],
  "itinerary": [
    {
      "dayNumber": "Number",
      "theme": "String",
      "activities": [
        {
          "title": "String",
          "description": "String",
          "timeOfDay": "Morning | Afternoon | Evening",
          "estimatedCost": "Number"
        }
      ]
    }
  ],
  "packingList": [
    {
      "item": "String",
      "category": "String",
      "isPacked": "Boolean"
    }
  ]
}
```

*Note: If the `GEMINI_API_KEY` environment variable is not defined, the backend automatically serves beautiful mock itinerary packages for testing, ensuring smooth developer setup.*

---

## Creative Feature: AI Weather-Aware Packing Assistant

When an itinerary is compiled, the application cross-references the target destination's climate profile during the specified season and automatically appends a localized smart packing checklist to the trip. 
Users can interactively check off items directly on their dashboard. These state modifications persist in MongoDB in real time so that travelers can resume packing lists across device sessions.

---

## Setup & Local Installation

### Prerequisites
*   Node.js (v18+)
*   MongoDB running locally on port 27017 (or a MongoDB Atlas connection string)
*   Google Gemini API Key (optional, defaults to fallback mocks if unconfigured)

### 1. Database Setup
Ensure MongoDB is running locally on port 27017. If running from command-line:
```powershell
mongod --dbpath <path-to-db-folder> --port 27017
```

### 2. Backend Setup
1. Open the `/backend` folder.
2. Create a `.env` file based on `.env.example`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/ai-travel-planner
   JWT_SECRET=supersecrettokenkeyforjwt
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Install dependencies and start:
   ```bash
   npm install
   npm run dev
   ```

### 3. Frontend Setup
1. Open the `/frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Access the web interface at `http://localhost:3000`.

---

## Running Verification Tests

To verify backend integrations, authentication guards, user isolation barriers, packing checklist toggles, and day-level regenerations:
```bash
cd backend
node test-api.js
```
All console assertions should output `✓ SUCCESS` and confirm that user isolation prevents cross-account edits.
