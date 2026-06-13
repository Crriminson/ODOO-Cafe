# Traveloop 🌍✈️

Traveloop is a personalized, AI-ready travel planning platform designed to make trip organization seamless. Build itineraries with a drag-and-drop interface, track your budget, manage your packing list, and discover community-driven tips—all in one place!

## Features 🚀

- **Interactive Drag-and-Drop Itinerary:** Organize daily activities intuitively using an optimistic, responsive drag-and-drop planning board.
- **Dynamic Geospatial Mapping:** Visualize your trip on an interactive map. Activity pins dynamically correlate with the itinerary to give you real-world context for your plans.
- **Budget Tracking & Expense Management:** Seamlessly allocate budgets and track costs, with automatic inclusion of priced activities.
- **Collaborative Community Feed:** Share travel experiences, read verified destination guides, upvote, and comment on itineraries posted by the community.
- **Discover Engine:** Instantly search for curated activities across popular destinations like Mumbai, Pune, and Manali, and add them to your trip in a single click.

## Tech Stack 🛠️

- **Frontend:** React, Vite, Tailwind CSS, `@dnd-kit/core`, Leaflet Maps
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL via Prisma ORM
- **Authentication:** JWT (JSON Web Tokens) with secure password hashing (Bcrypt)

## Getting Started 💻

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd Traveloop
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   # Configure your .env variables (DATABASE_URL, JWT_SECRET, etc.)
   npx prisma migrate dev --name init
   npm run seed        # Seeds essential core data (Cities)
   npm run seed:users  # (Optional) Seeds dummy users and community data
   npm run dev         # Starts backend on http://localhost:5000
   ```

3. **Frontend Setup:**
   ```bash
   cd ../client
   npm install
   # Configure your .env file with VITE_API_URL=http://localhost:5000/api/v1
   npm run dev         # Starts frontend on http://localhost:5173
   ```

## Development & Best Practices 💡
- **Prisma Studio:** Use `npx prisma studio` in the server directory for an instant database GUI.
- **Seeding:** Dedicated seeding scripts (`seed.js`, `seed-community.js`, `seed-activities.js`) are available to rapidly spin up demo environments.

## Contributors
- Traveloop Engineering Team
