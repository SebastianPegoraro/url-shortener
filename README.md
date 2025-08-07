# URL Shortener

A modern, full-stack URL shortening service built with Next.js 15, TypeScript, and serverless architecture. Transform long URLs into short, shareable links with real-time analytics and a beautiful, responsive interface.

![URL Shortener Demo](https://via.placeholder.com/800x400/2563eb/ffffff?text=URL+Shortener+Demo)

## ✨ Features

- 🔗 **Instant URL Shortening** - Convert long URLs to short, memorable links
- 📊 **Click Analytics** - Track clicks and usage statistics in real-time
- 📱 **Responsive Design** - Beautiful UI that works on all devices
- ⚡ **Lightning Fast** - Serverless architecture with global CDN distribution
- 🔒 **Secure & Reliable** - Collision-resistant short codes with proper validation
- 🎨 **Modern UI/UX** - Clean, intuitive interface with instant feedback
- 📋 **Copy to Clipboard** - One-click copying with visual feedback
- 🔄 **Recent URLs Dashboard** - View and manage your shortened links
- 🌐 **Production Ready** - Deployed on Vercel with Neon PostgreSQL

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/url-shortener.git
   cd url-shortener
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:

   ```env
   DATABASE_URL="file:./dev.db"
   DATABASE_PROVIDER="sqlite"
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   ```

4. **Initialize the database**

   ```bash
   npm run db:generate:dev
   npm run db:migrate:dev --name init
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **React Hot Toast** - Beautiful notifications

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Production database (Neon)
- **SQLite** - Development database

### Deployment

- **Vercel** - Serverless deployment platform
- **Neon** - Serverless PostgreSQL database
- **Global CDN** - Edge distribution

## 📁 Project Structure

```
url-shortener/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [shortCode]/        # Dynamic route for redirects
│   │   │   └── page.tsx
│   │   ├── api/                # API endpoints
│   │   │   ├── shorten/        # URL shortening endpoint
│   │   │   └── urls/           # URLs retrieval endpoint
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── not-found.tsx       # 404 page
│   ├── components/             # React components
│   │   ├── UrlShortener.tsx    # Main shortening component
│   │   └── RecentUrls.tsx      # Dashboard component
│   └── lib/                    # Utilities
│       ├── prisma.ts           # Database client
│       └── utils.ts            # Helper functions
├── prisma/                     # Database schema & migrations
│   ├── schema.dev.prisma       # Development schema (SQLite)
│   ├── schema.prod.prisma      # Production schema (PostgreSQL)
│   └── migrations/             # Database migrations
├── package.json                # Dependencies & scripts
└── README.md                   # This file
```

## 🔧 Available Scripts

```bash
# Development
npm run dev                     # Start development server
npm run db:generate:dev         # Generate Prisma client for development
npm run db:migrate:dev          # Run database migrations for development

# Production
npm run build                   # Build for production
npm run start                   # Start production server
npm run db:generate:prod        # Generate Prisma client for production
npm run db:push:prod           # Push schema to production database

# Utilities
npm run lint                    # Run ESLint
npm run db:studio:dev          # Open Prisma Studio for development
npm run db:studio:prod         # Open Prisma Studio for production
```

## 🏛️ Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │───▶│   Next.js API   │───▶│   PostgreSQL    │
│   Components    │    │     Routes      │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │              ┌─────────────────┐              │
        └─────────────▶│   Prisma ORM    │──────────────┘
                       └─────────────────┘
```

### Key Design Patterns

- **Repository Pattern** - Prisma ORM abstracts database operations
- **Factory Pattern** - Short code generation with nanoid
- **Singleton Pattern** - Single Prisma client instance
- **MVC Architecture** - Separation of concerns across layers

## 🔒 Security Features

- **URL Validation** - Comprehensive input validation and sanitization
- **Collision Resistance** - Cryptographically secure short code generation
- **Rate Limiting Ready** - Architecture supports rate limiting implementation
- **SQL Injection Prevention** - Prisma ORM provides protection
- **XSS Protection** - React's built-in XSS prevention

## 📊 Performance Features

- **Database Indexing** - Unique indexes for fast lookups
- **Connection Pooling** - Efficient database connections
- **Serverless Architecture** - Auto-scaling based on demand
- **CDN Distribution** - Global edge caching
- **Optimistic UI Updates** - Instant user feedback

## 🗺️ Roadmap

- [ ] User authentication and personal dashboards
- [ ] Custom short codes for branded links
- [ ] Advanced analytics with charts and graphs
- [ ] QR code generation for short URLs
- [ ] API rate limiting and authentication
- [ ] Bulk URL shortening
- [ ] Link expiration and password protection
- [ ] Custom domains for branded short links

---
