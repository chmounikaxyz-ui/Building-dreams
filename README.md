# 🏗️ Building Dreams

**Live Deployment:** [https://building-dreams.onrender.com](https://building-dreams.onrender.com)

Building Dreams is a comprehensive, modern web platform designed to organize and streamline the construction labor sector. It acts as a bridge, connecting clients ("Explorers") with skilled construction professionals ("Workers" — masons, carpenters, electricians, architects, and more) for seamless hiring, communication, and project management.

---

## ✨ Key Features

### 🔍 1. Intelligent Professional Discovery
* **Location-Based Search:** Automatically detects user location (or allows manual input) to find workers nearby. It calculates accurate distances using the Haversine formula.
* **Smart Filtering:** Filter professionals by trade category, availability status, verified badge, minimum rating, and maximum distance.
* **Worker Profiles:** View comprehensive portfolios, including experience, past project gallery, reviews, skills, and crew size.

### 💬 2. Real-Time Communication
* **Instant Messaging:** Built-in chat system allows Explorers and Workers to negotiate rates and discuss project details before hiring.
* **WebRTC Voice Calling:** High-quality, peer-to-peer voice calling integrated directly into the chat interface without needing third-party apps. Features custom synthetic ringtones for a native feel.

### 📋 3. Job Management & Hire Requests
* **Streamlined Hiring:** Send, accept, or reject hire requests with clear start dates and project parameters.
* **Active Job Dashboard:** Track ongoing projects ("My Activity"), monitor active jobs, and mark them as completed once finished.
* **Emergency Services:** Dedicated specialized flow for urgent requirements. Immediately route and connect with available workers for critical, time-sensitive repairs.

### 🧱 4. Materials & Construction Tools
* **Construction Materials Marketplace:** A dedicated ecosystem allowing "Sellers" to list and sell construction materials (cement, timber, bricks, etc.) directly to Explorers or Workers.
* **Digital Construction Tools:** Built-in calculators and estimators for seamless project management. Includes an **Expense Tracker**, **Storage Manager** (for stock counts), **Cost Estimator**, and an **EMI Calculator** for loans.

### ⭐ 5. Trust & Transparency
* **Multi-dimensional Rating System:** Rate completed jobs across 5 distinct categories: Functionality, Behavior, Communication, Speed, and Responsiveness.
* **Verified Badges:** Visual indicators for vetted and trusted professionals.
* **Direct Payments:** Professionals can list their UPI ID and Bank Details for secure, direct, middleman-free payments.

---

## 🚀 Advantages & Value Proposition

* **Eliminates Middlemen:** Direct connection between clients and workers ensures fair wages for professionals and cost savings for clients.
* **Organizes the Unorganized Sector:** Brings structure to the traditional, word-of-mouth construction labor market through a digital, transparent ecosystem.
* **Saves Time:** Location-based filtering and instant availability statuses mean you find the right person immediately, preventing delays in your construction timeline.
* **Data Privacy:** Peer-to-peer (WebRTC) calling ensures conversations remain private.

---

## 🛠️ Technology Stack

* **Frontend:** React, Next.js (App Router), TypeScript, Tailwind CSS, Lucide React, Framer Motion (for animations).
* **Backend:** Next.js API Routes (Serverless).
* **Database:** SQLite (Development) / Prisma ORM.
* **Communication:** WebRTC API, Web Audio API.
* **Deployment:** Hosted on Render.

---

## 🏁 Getting Started (Local Development)

### Prerequisites
* Node.js (v18+)
* npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/chmounikaxyz-ui/Building-dreams.git
   cd Building-dreams
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up the Database:**
   Generate the Prisma client and push the schema to your local SQLite database.
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 User Roles

* **Explorer:** The client or project owner seeking to hire professionals.
* **Worker:** The skilled tradesperson offering services (can operate individually or as a crew).
* **Seller:** Material suppliers (future roadmap feature).

---

<p align="center">
  <i>Building Dreams — Constructing the future, one connection at a time.</i>
</p>
