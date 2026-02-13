# MicroLearn - Study in Bites

## Overview
MicroLearn is an AI-powered micro-learning application built with Next.js 16. It transforms lectures and PDFs into TikTok-style bite-sized micro-lessons. Features include user authentication (better-auth), AI content generation, and interactive lesson feeds.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM (v7)
- **Auth**: better-auth with email/password and Google OAuth
- **AI**: Google GenAI, OpenAI
- **Styling**: Tailwind CSS v4, Framer Motion
- **State**: Zustand

## Project Structure
- `app/` - Next.js App Router pages and API routes
- `app/api/` - API endpoints (auth, feed, interact, upload)
- `components/` - React components (UI, theme, feed)
- `lib/` - Utilities (auth, AI, store, Prisma client)
- `prisma/` - Database schema
- `public/` - Static assets

## Configuration
- Port: 5000 (dev and production)
- Host: 0.0.0.0
- Database: PostgreSQL via DATABASE_URL env var
- Prisma client generated to `lib/generated/prisma`

## Recent Changes
- 2026-02-13: Initial Replit setup - configured port 5000, database, Prisma schema push
