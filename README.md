# Harvey 🍽️

A Progressive Web App for tracking kitchen inventory by scanning barcodes.

## Features

**📱 Barcode Scanning**
- Camera-based barcode scanning
- Manual barcode entry fallback
- Automatic product lookup via Open Food Facts API

**🏷️ Category Management**
- Organize items by Fridge or Pantry
- Filter view by category
- Color-coded badges

**📊 Quantity Tracking**
- Auto-stacking of duplicate items
- Increment/decrement controls
- Smart removal (decrements or deletes)

**✨ Smart UI**
- Confirmation dialogs for deletions
- Real-time inventory counts
- Mobile-first responsive design
- PWA support (install as app)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Turso (libSQL) + Drizzle ORM
- html5-qrcode

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
TURSO_DATABASE_URL=your_database_url
TURSO_AUTH_TOKEN=your_auth_token
```
