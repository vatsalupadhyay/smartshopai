# SmartShop AI

A smart shopping assistant powered by AI that helps you make informed purchasing decisions by analyzing product reviews, prices, and features across multiple e-commerce platforms.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [Environment Variables](#environment-variables)
- [Support](#support)

## Features

- AI-powered product analysis
- Multi-platform price comparison
- Review aggregation and sentiment analysis
- Real-time product scraping
- User authentication and personalization
- Caching and rate-limiting for optimal performance

## Technologies

This project uses a modern full-stack setup:

- **Frontend:**
  - Vite
  - TypeScript
  - React.js
  - Tailwind CSS
  - shadcn-ui
  - Various React libraries for UI, state management, parsing, and graph visualizations

- **Backend:**
  - Supabase (Backend, Auth, Database, Edge Functions)
  - Firebase (Auxiliary services / integrations)

- **Web Scraping:**
  - Scrape.do API for rendered page scraping

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm or yarn
- Git
- A Supabase account
- A Firebase account
- A Scrape.do API token

## Installation

1. **Clone the repository:**

```powershell
git clone <YOUR_GIT_URL>
cd smartshop-ai
```

2. **Install dependencies:**

```powershell
npm install
```

## Configuration

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API to find your project URL and anon key
3. Go to Project Settings → Database to find your connection strings
4. Set up your database schema (migrations should be in the repository)
5. Configure Edge Functions in the Supabase dashboard

### 2. Firebase Setup

1. Create a new project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication and choose your sign-in methods
3. Go to Project Settings → General to find your Firebase configuration
4. Add your Firebase config to the environment variables

### 3. Scrape.do API Token

1. Sign up at [scrape.do](https://scrape.do)
2. Generate an API token
3. **IMPORTANT:** Never commit this token to the repository

### 4. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Scrape.do API Token
SCRAPEDO_API_TOKEN=367e1b8c387743d2a0bf4aa8f3bffc470d575dfe73d

# Supabase Configuration
VITE_SUPABASE_URL=https://rtdofkxieosouzqczolt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZG9ma3hpZW9zb3V6cWN6b2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTQ4NzUsImV4cCI6MjA3ODg5MDg3NX0.jCVXYhxGejRQtk9t37zrN9eCGPq7VnDzicwA13HrEgA

# Supabase Database Connection (with connection pooling)
DATABASE_URL=postgresql://postgres.rtdofkxieosouzqczolt:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct Database Connection (for migrations)
DIRECT_URL=postgresql://postgres.rtdofkxieosouzqczolt:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Note:** Replace `[YOUR-PASSWORD]` with your actual Supabase database password.

### 5. Supabase Edge Function Configuration

For production deployment, set environment variables in your Supabase Edge Functions:

1. Go to Supabase Dashboard → Functions → Settings
2. Add the following environment variables:

```
SCRAPEDO_API_TOKEN=your_token_here
CACHE_TTL_SECONDS=300
RATE_LIMIT_WINDOW=3600
RATE_LIMIT_MAX=30
MAX_FETCH_REVIEWS=200
```

For local testing, set the token in your shell (do not commit it):

```powershell
$env:SCRAPEDO_API_TOKEN = "your_token_here"
```

## Running the Project

### Development Mode

```powershell
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is busy).

### Build for Production

```powershell
npm run build
```

### Preview Production Build

```powershell
npm run preview
```

## Environment Variables Reference

### Scraping Configuration

- `SCRAPEDO_API_TOKEN` — Your Scrape.do API token for rendering JavaScript-heavy pages

### Supabase Configuration

- `VITE_SUPABASE_URL` — Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Your Supabase anonymous/public API key
- `DATABASE_URL` — Connection pooling URL for database queries
- `DIRECT_URL` — Direct connection URL for running migrations

### Firebase Configuration

- `VITE_FIREBASE_API_KEY` — Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` — Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` — Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` — Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` — Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` — Firebase app ID

### Edge Function Configuration

- `CACHE_TTL_SECONDS` (default: 300) — Cache duration for scraped results in seconds
- `RATE_LIMIT_WINDOW` (default: 3600) — Sliding window length in seconds
- `RATE_LIMIT_MAX` (default: 30) — Maximum requests per IP within the window
- `MAX_FETCH_REVIEWS` (default: 200) — Maximum number of reviews to fetch per page

## Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the maintainers.

---

**Happy Shopping with AI! 🛍️🤖**