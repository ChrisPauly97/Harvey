# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Harvey** is a Progressive Web App (PWA) for tracking kitchen inventory by scanning product barcodes. It allows users to maintain a real-time inventory of food items in their fridge and pantry, with automatic product lookup via the Open Food Facts API.

### Key Features

- 📱 **Barcode Scanning**: Camera-based barcode detection with ZXing library + manual entry fallback
- 🏷️ **Category Management**: Organize items into Fridge or Pantry with color-coded badges
- 📊 **Quantity Tracking**: Auto-stacking of duplicates with increment/decrement controls
- ✨ **Smart UI**: Confirmation dialogs, real-time counts, mobile-first responsive design
- 📱 **PWA Support**: Installable as a native-like app on mobile devices

## Tech Stack

### Frontend
- **Next.js 14** (App Router for file-based routing)
- **React 18** (UI components)
- **TypeScript** (strict mode enabled)
- **Tailwind CSS** (utility-first styling)
- **ZXing** (`@zxing/browser` v0.1.5, `@zxing/library` v0.21.3) for barcode detection

### Backend & Database
- **Next.js API Routes** for REST endpoints
- **Drizzle ORM** (v0.45.1) for type-safe database access
- **SQLite** via Turso/libSQL (`@libsql/client` v0.17.0)
- Database configured in `.env.local` with `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`

### Build & Development
- **TypeScript 5.6** with strict compiler options
- **ESLint** with Next.js config
- **PostCSS** with Tailwind CSS
- **Drizzle Kit** for database migrations

## Project Structure

```
app/
├── layout.tsx          # Root layout (PWA metadata, dark mode)
├── page.tsx            # Main inventory view
├── scan/
│   └── page.tsx        # Barcode scanner page
└── api/
    └── items/
        ├── route.ts    # GET (list items), POST (add item)
        └── [id]/route.ts  # GET, PATCH, DELETE for specific items

components/
├── BarcodeScanner.tsx  # ZXing-based scanner component
├── ItemCard.tsx        # Individual item display card
└── ThemeToggle.tsx     # Dark/light mode toggle

lib/
├── db.ts              # Database client initialization
├── schema.ts          # Drizzle table definitions (items table)
└── migrate.ts         # Migration utilities

drizzle/
└── migrations/        # Database migration files

public/
└── manifest.json      # PWA manifest for app installation

.beads/
└── issues.jsonl      # Beads issue tracking system, look here for new tasks
```

## Database Schema

**items** table with columns:
- `id`: Auto-incrementing primary key
- `barcode`: Unique barcode identifier
- `name`: Product name
- `quantity`: Item count (default: 1)
- `category`: Enum ("fridge" | "pantry"), default: "fridge"
- `addedAt`: Timestamp (auto-set to current time)
- `imageUrl`: Optional product image URL

## Build & Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Environment Setup

Create `.env.local` with:
```
TURSO_DATABASE_URL=<your-turso-database-url>
TURSO_AUTH_TOKEN=<your-turso-auth-token>
```

## Database Migrations

### Applying Migrations to Turso

When you've updated `lib/schema.ts` with new tables/fields, apply migrations to the database:

**⚠️ Important**: `drizzle-kit push` has a known issue with Turso authentication tokens. If you get a 401 error, use the workaround below.

#### Method 1: Using Turso CLI (Recommended)

1. **Generate a database-specific token:**
   ```bash
   turso db tokens create fridgescanner --read-write
   ```
   **Note**: Use the database name `fridgescanner`, not `fridgescanner-leftclick`

2. **Apply migrations directly via Turso CLI:**
   ```bash
   cat drizzle/000X_<migration_name>.sql | turso db shell fridgescanner
   ```
   Or execute multiple migrations in order:
   ```bash
   for file in drizzle/000*.sql; do
     cat "$file" | turso db shell fridgescanner
   done
   ```

3. **Verify the migration:**
   ```bash
   turso db shell fridgescanner "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
   ```

#### Method 2: Using drizzle-kit (If working)

```bash
# Set environment variables
export TURSO_DATABASE_URL="libsql://fridgescanner-leftclick.aws-eu-west-1.turso.io"
export TURSO_AUTH_TOKEN="<your-database-token>"

# Push migrations
npx drizzle-kit push
```

### Troubleshooting Migrations

| Issue | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` from drizzle-kit | Token authentication incompatibility | Use Turso CLI method instead |
| Token not working with drizzle-kit but works with `turso db shell` | drizzle-kit authentication issue | Use `turso db shell` workaround |
| `Database not found` error | Wrong database name in token creation | Use `fridgescanner` not `fridgescanner-leftclick` |
| Migrations not found | SQL files not in `drizzle/` directory | Run `npx drizzle-kit generate` first |

### Migration Files

Migration SQL files are stored in `drizzle/` directory:
- `0003_yielding_wolverine.sql` - Phase 1-2: Freezer, expiration, brand, tags
- `0004_perfect_hercules.sql` - Phase 3: Portion splitting
- `0005_shopping_list_analytics.sql` - Phase 4: Event tracking, shopping list

## Architecture Notes

- **PWA-First**: Configured for mobile installation with manifest.json and viewport settings
- **Type-Safe**: Full TypeScript, Drizzle ORM with inferred types from schema
- **API Design**: RESTful endpoints at `/api/items` with id-based routing
- **Component Design**: Modular, reusable components for scanning, display, and controls
- **Styling**: Tailwind CSS with dark mode as default theme
- **Scanner**: Uses ZXing library for continuous barcode detection with proper stream cleanup

## Key Development Conventions

- Use TypeScript strict mode throughout
- Component-based architecture with functional components
- API routes follow Next.js conventions with proper HTTP methods
- Database types automatically inferred from Drizzle schema
- PWA manifest at `/public/manifest.json` for installability
