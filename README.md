# 🚀 Full Stack Agentic App Builder

Build AI-powered applications from simple prompts using **Next.js, Supabase, Gemini AI, Cline SDK, Clerk, and Shadcn UI**.

Users describe the app they want, and the AI generates production-ready React code with a live preview, persistent workspace history, image uploads, and autonomous AI improvements—similar to **Bolt.new** and **Lovable**.

---

## 📋 Table of Contents

* Overview
* Features
* Tech Stack
* Architecture
* Getting Started
* Installation
* Environment Variables
* Database Setup
* Credits & Plans
* AI Workflow

---

# 🌟 Overview

This project is a full-stack AI application builder that transforms natural language prompts into working React applications.

Users can:

* Generate complete React applications using AI
* Preview generated code instantly with Sandpack
* Upload images and use them in prompts
* Save project history automatically
* Improve generated apps using an autonomous AI Agent powered by Cline SDK
* Export projects as ZIP files
* Manage credits and subscriptions

The platform combines modern AI tooling with a production-ready SaaS architecture.

---

# ✨ Features

## 🏠 Landing Page

* Prompt textarea with rotating placeholders
* Suggestion chips for quick prompts
* Browser-style live preview mockup
* Feature showcase section
* Step-by-step workflow explanation
* Pricing section using Clerk PricingTable
* Fully responsive dark theme UI

---

## 🔐 Authentication & Billing

Powered by Clerk.

### Features

* Google OAuth Sign-In
* User creation in Supabase on first login
* Credit allocation for new users
* Automatic plan detection
* Credit top-ups on plan upgrades
* Pricing modal accessible from header

---

## 💬 Workspace

A powerful split-screen environment.

### Left Panel

* AI chat interface
* Streaming responses
* Markdown rendering
* Blinking typing cursor
* Persistent chat history
* User avatars
* Auto-scroll support

### Right Panel

* Live code preview
* Code editor
* File explorer
* Preview tab
* Code tab

---

## 🖼️ Image Upload Support

Users can upload images directly inside chats.

### Flow

1. Upload image
2. Store in Supabase Storage
3. Generate public CDN URL
4. Inject image URL into AI prompt
5. AI uses image context while generating code

---

## 🤖 AI Code Generation

### Endpoint

/api/gen-ai-code

### Powered By

* Gemini 3.5 Flash
* Thinking Configuration Enabled

### Features

* Streams reasoning steps live
* Returns strict JSON structure

```json
{
  "assistantMessage": "",
  "title": "",
  "files": {},
  "dependencies": {}
}
```

* Filters hallucinated npm packages
* Validates dependencies against npm registry
* Atomic database transactions
* Automatic credit deduction

---

## 🧠 Improve with AI Agent

### Endpoint

/api/improve

Powered by:

* Cline SDK (@cline/sdk)

Available for:

* Starter Plan
* Pro Plan

### Agent Capabilities

* Understands project structure
* Updates files autonomously
* Streams reasoning in real time
* Patches files one-by-one
* Updates Sandpack instantly

### Tools

#### update_file

Modifies project files.

#### done_improving

Terminates agent execution cleanly.

```ts
lifecycle: {
  completesRun: true
}
```

---

## 🛠️ Fix with AI

Automatically detects:

* Runtime errors
* Compilation errors
* Build errors

### Workflow

1. Error detected inside Sandpack
2. Error banner appears
3. User clicks "Fix with AI"
4. Error context sent to Gemini
5. AI generates corrected code

---

## ⚡ Sandpack Integration

### Features

* Live preview
* File explorer
* Read-only CodeMirror editor
* Tailwind CSS support
* Instant updates

### Performance Optimizations

* Smart re-keying
* Remount only when file structure changes
* Preserve state when file contents change

---

## 📦 Export Project

Users can download generated projects as ZIP files.

Includes:

* Source code
* package.json
* Dependencies
* Project structure

Ready to run locally.

---

## 📂 Projects Dashboard

Manage all generated workspaces.

### Features

* Workspace grid view
* Prompt preview
* Message count
* Last updated timestamp
* Delete project functionality
* Confirmation modal
* Empty state CTA

---

## 💳 Credit System

### Free Plan

* 10 Credits

### Starter Plan

* 50 Credits

### Pro Plan

* 150 Credits

### Usage

| Action          | Cost     |
| --------------- | -------- |
| Generate App    | 1 Credit |
| Improve with AI | 1 Credit |

### Validation

* Client-side checks
* Server-side protection (HTTP 402 fallback)

Credits are preserved on downgrades and topped up on upgrades.

---

# 🏗️ Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js 15 (App Router, TypeScript) |
| Authentication | Clerk                               |
| Billing        | Clerk                               |
| Database       | Supabase PostgreSQL                 |
| ORM            | Prisma                              |
| Storage        | Supabase Storage                    |
| AI Model       | Gemini 3.5 Flash                    |
| AI Agent       | Cline SDK                           |
| Code Preview   | Sandpack                            |
| Styling        | Tailwind CSS v4                     |
| UI Components  | Shadcn UI                           |
| Rate Limiting  | Arcjet                              |

---

# 🏛️ Architecture

```text
User
 │
 ▼
Next.js Frontend
 │
 ├── Clerk Authentication
 ├── Sandpack Preview
 ├── Chat Workspace
 │
 ▼
API Routes
 │
 ├── /api/gen-ai-code
 ├── /api/improve
 └── /api/upload
 │
 ▼
Gemini AI + Cline Agent
 │
 ▼
Supabase + Prisma
 │
 ├── Users
 ├── Workspaces
 ├── Messages
 └── File Data
```

---

# 🚀 Getting Started

## Prerequisites

* Node.js 22+
* Supabase Project
* Clerk Application
* Google AI Studio API Key
* Arcjet Account

---

# 📥 Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/buildai.git
cd buildai
```

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npx prisma generate
```

Push database schema:

```bash
npx prisma db push
```

Start development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🔑 Environment Variables

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

# 🗄️ Database Setup

## User Model

```ts
User {
  id
  clerkId
  name
  email
  imageUrl
  credits
  plan
  createdAt
  updatedAt
}
```

### Purpose

* Synced from Clerk
* Stores credits
* Tracks subscription plans

---

## Workspace Model

```ts
Workspace {
  id
  userId
  title
  messages
  fileData
  createdAt
  updatedAt
}
```

### Purpose

* Stores chat history
* Stores generated files
* Stores validated dependencies

---

## Supabase Storage

### Bucket

```text
workspace-images
```

Structure:

```text
workspace-images/
 └── userId/
      └── workspaceId/
           └── image.png
```

Public URLs are injected into prompts automatically.

---

# 🔄 AI Workflow

```text
User Prompt
      │
      ▼
 Gemini 3.5 Flash
      │
      ▼
 Generated Files
      │
      ▼
 Sandpack Preview
      │
      ▼
 Improve with Cline Agent
      │
      ▼
 Updated Production App
```

---

# 🎯 Future Enhancements

* Multi-file code generation
* Team collaboration
* Real-time multiplayer editing
* GitHub repository export
* Custom AI model selection
* Deployment to Vercel with one click
* AI-powered design system generation

---

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using Next.js, Supabase, Gemini AI, Cline SDK, Clerk, Tailwind CSS, and Shadcn UI.
