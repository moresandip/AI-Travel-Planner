require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for simplicity in development and testing
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

// Root Route (Welcome/Info Page)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Travel Planner API Backend</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background-color: #0b0f19;
          color: #f1f5f9;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          text-align: center;
        }
        .container {
          background: rgba(30, 41, 59, 0.4);
          padding: 3rem;
          border-radius: 1rem;
          border: 1px solid #1e293b;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          max-width: 500px;
        }
        h1 {
          color: #38bdf8;
          margin-bottom: 0.5rem;
        }
        .status {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #064e3b;
          color: #34d399;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        p {
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
        .code-block {
          background: #0f172a;
          padding: 1rem;
          border-radius: 0.5rem;
          font-family: monospace;
          color: #e2e8f0;
          font-size: 0.875rem;
          text-align: left;
          border: 1px solid #1e293b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="status">● API Backend Online</div>
        <h1>AI Travel Planner API</h1>
        <p>You have successfully reached the backend API server. To view the user interface, please start the frontend application locally or deploy it to a hosting platform like Vercel or Netlify.</p>
        <div class="code-block">
          // Run frontend locally:<br>
          cd frontend<br>
          npm run dev
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Travel Planner Backend is active' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
