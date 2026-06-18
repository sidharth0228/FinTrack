import authRouter from './routes/auth.js';
import expensesRouter from './routes/expenses.js';
import incomeRouter from './routes/income.js';
import goalsRouter from './routes/goals.js';
import budgetRouter from './routes/budget.js';
import stocksRouter from './routes/stocks.js';
import userRouter from './routes/user.js';
import loansRouter from './routes/loans.js';
import healthScoreRouter from './routes/healthScore.js';
import newspaperRouter from './routes/newspaper.js';
import watchlistRouter from './routes/watchlist.js';
import alertsRouter from './routes/alerts.js';
import savedArticlesRouter from './routes/savedArticles.js';

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';

// Load environment variables
dotenv.config();

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '..')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/income', incomeRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/budget', budgetRouter);
app.use('/api/stocks', stocksRouter);
app.use('/api/user', userRouter);
app.use('/api/loans', loansRouter);
app.use('/api/health-score', healthScoreRouter);
app.use('/api/newspaper', newspaperRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/newspaper/saved', savedArticlesRouter);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully to:', process.env.MONGO_URI))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('TIP: Make sure MongoDB service is running (mongod) and the MONGO_URI in .env is correct.');
    });

// Initialize Cron Jobs for Email Notifications and EMI Automation
import { startMonitorSpendingCron, startMonthlySummaryCron, startLoanEMICron, startCreditCardPaymentCron } from './utils/cronJobs.js';
startMonitorSpendingCron();
startMonthlySummaryCron();
startLoanEMICron();
startCreditCardPaymentCron();

import DailyNewspaperScheduler from './services/DailyNewspaperScheduler.js';
DailyNewspaperScheduler.start();

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
