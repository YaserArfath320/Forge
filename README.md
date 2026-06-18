# 🚀 BuildAI - Full Stack Agentic App Builder

Build complete React applications using AI.

BuildAI allows users to describe an app in plain English and instantly generate production-ready React code with a live preview, persistent chat history, image uploads, and AI-powered improvements.

Inspired by platforms like Bolt.new and Lovable.

---

## 🌐 Live Demo

deployed URL here:

```text
https://forge-ruddy-seven.vercel.app/
```


## ✨ Features

* [x] AI-powered React app generation
* [x] Live Sandpack preview
* [x] Persistent chat history
* [x] Image upload support
* [x] Clerk authentication
* [x] Google OAuth login
* [x] Credit-based usage system
* [x] Subscription plans
* [x] AI-powered app improvements using Cline SDK
* [x] Runtime error detection
* [x] Fix with AI functionality
* [x] Project management dashboard
* [x] Export projects as ZIP
* [x] Dark mode UI
* [x] Responsive design

---

## 🏗️ Tech Stack

| Category       | Technology          |
| -------------- | ------------------- |
| Framework      | Next.js 15          |
| Language       | TypeScript          |
| Authentication | Clerk               |
| Billing        | Clerk               |
| Database       | Supabase PostgreSQL |
| ORM            | Prisma              |
| Storage        | Supabase Storage    |
| AI Model       | Gemini Flash        |
| AI Agent       | Cline SDK           |
| Code Preview   | Sandpack            |
| Styling        | Tailwind CSS        |
| UI Components  | Shadcn UI           |
| Rate Limiting  | Arcjet              |

---

## 🧠 How It Works

### 1. Generate an App

Users enter a prompt describing the application they want to build.

Example:

```text
Create a modern fitness tracker dashboard with charts and dark mode.
```

The AI generates:

* React components
* Styling
* File structure
* Dependencies

---

### 2. Preview Instantly

Generated code is rendered inside Sandpack, allowing users to interact with the application immediately.

---

### 3. Improve with AI

Pro and Starter users can launch an AI agent powered by Cline SDK.

The agent:

* Analyzes the project
* Updates files autonomously
* Improves UI and functionality
* Streams progress in real time

---

### 4. Export Project

Download the generated project as a ZIP file and continue development locally.

---

## 🔐 Authentication

Authentication is powered by Clerk.

Features include:

* Google OAuth Login
* Secure session management
* User profile syncing
* Subscription plan management

---

## 💳 Credits & Plans

| Plan    | Credits |
| ------- | ------- |
| Free    | 10      |
| Starter | 50      |
| Pro     | 150     |

### Usage Cost

| Action          | Credits |
| --------------- | ------- |
| Generate App    | 1       |
| Improve with AI | 1       |

Credits are automatically managed based on the user's subscription plan.

---

## 🗄️ Database

### User

Stores:

* Clerk user information
* Credits
* Subscription plan

### Workspace

Stores:

* Chat history
* Generated files
* Dependencies
* Project metadata

---

## ⚙️ Environment Variables

Create a `.env.local` file:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Database
DATABASE_URL=

# Gemini
GEMINI_API_KEY=

# Arcjet
ARCJET_KEY=
```

---

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/YaserArfath320/buildai.git
cd buildai
```

### Install Dependencies

```bash
npm install
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Push Database Schema

```bash
npx prisma db push
```

### Start Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 📂 Project Structure

```text
app/
├── api/
│   ├── gen-ai-code/
│   ├── improve/
│   └── upload/
├── workspace/
├── projects/
└── page.tsx

components/
lib/
prisma/
public/
```

---

## 🎯 Key Highlights

* Full-stack AI SaaS architecture
* Real-time AI code generation
* Autonomous AI agent improvements
* Live code preview and editing
* Scalable PostgreSQL backend
* Production-ready authentication and billing
* Modern UI built with Shadcn UI and Tailwind CSS

---

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using Next.js, Supabase, Gemini AI, Clerk, Cline SDK, Tailwind CSS, and Shadcn UI.
