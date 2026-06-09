# BuildFlow - Full-Stack Construction Marketplace

A modern, fully functional full-stack web application connecting construction professionals, workers, clients, and suppliers.

## 🎯 Features

### ✅ Complete Implementation

- **User Authentication**
  - User signup and login with JWT tokens
  - Password hashing with bcryptjs
  - Persistent authentication via localStorage

- **Posts & Feed**
  - Create, view, and share construction project photos and updates
  - Like and save posts
  - Follow other professionals
  - Real-time database integration

- **Messages**
  - Direct messaging between users
  - Conversation management
  - Message history

- **User Profiles**
  - Professional profiles with ratings and verification
  - User bios and locations
  - Profile customization

- **Materials Marketplace**
  - Browse construction materials
  - Add to cart functionality
  - Price and inventory management

- **Database**
  - SQLite database with Prisma ORM
  - 11+ tables with relationships
  - Seed data with sample users and posts

- **API**
  - RESTful API endpoints
  - Authentication routes
  - Post management routes
  - Message and conversation routes
  - User follow/unfollow routes

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Initialize database:**
```bash
$env:DATABASE_URL='file:./prisma/dev.db'; npx prisma migrate dev --name init
```

3. **Seed database with sample data:**
```bash
$env:DATABASE_URL='file:./prisma/dev.db'; npx tsx ./prisma/seed.ts
```

4. **Start development server:**
```bash
npm run dev
```

5. **Open browser:**
Navigate to `http://localhost:3000/auth`

### Demo Credentials

**Username:** ramesh@construction.com  
**Password:** password123

Or create a new account during signup.

## 📁 Project Structure

```
construction/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── signup/route.ts
│   │   ├── posts/
│   │   │   ├── route.ts
│   │   │   ├── like/route.ts
│   │   │   └── save/route.ts
│   │   ├── messages/
│   │   │   ├── route.ts
│   │   │   └── [conversationId]/route.ts
│   │   └── users/
│   │       ├── route.ts
│   │       └── follow/route.ts
│   ├── auth/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── main-feed.tsx
│   ├── sidebar.tsx
│   ├── messages-page.tsx
│   ├── materials-page.tsx
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       └── ...
├── context/
│   ├── app-context.tsx
│   └── auth-context.tsx
├── lib/
│   ├── db/
│   │   ├── prisma.ts
│   │   └── auth.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── dev.db
└── package.json
```

## 🗄️ Database Schema

### Tables
- **User** - User profiles with credentials
- **Post** - Construction project posts
- **Like** - Post likes
- **Save** - Saved posts
- **Comment** - Post comments
- **Follow** - User follow relationships
- **Conversation** - Direct message conversations
- **Message** - Individual messages
- **CartItem** - Shopping cart items
- **Material** - Construction materials catalog

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `POST /api/posts/like` - Toggle like on post
- `POST /api/posts/save` - Toggle save on post

### Messages
- `GET /api/messages?userId=...` - Get conversations
- `POST /api/messages` - Create conversation
- `GET /api/messages/[conversationId]` - Get messages in conversation
- `POST /api/messages/[conversationId]` - Send message

### Users
- `GET /api/users` - Get users list
- `POST /api/users/follow` - Toggle follow user

## 🔐 Authentication Flow

1. User signs up or logs in
2. Backend validates credentials and generates JWT token
3. Token stored in localStorage
4. Token sent in requests (can be extended to use Authorization header)
5. User redirected to app, logout clears token and localStorage

## 🛠️ Tech Stack

**Frontend:**
- React 18+
- Next.js 16
- TypeScript
- Tailwind CSS
- Radix UI Components
- Lucide Icons

**Backend:**
- Next.js API Routes
- Prisma ORM
- SQLite Database
- JWT Authentication
- Bcrypt Password Hashing

## 📝 Environment Variables

Create `.env.local`:
```
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-jwt-secret-key-change-in-production"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## 🧪 Testing the App

1. **Login:**
   - Navigate to `/auth`
   - Use demo credentials or create new account

2. **Feed:**
   - View posts from all users
   - Like and save posts
   - Follow users

3. **Messages:**
   - Click on messages tab
   - Select conversation to chat
   - Send and receive messages

4. **Materials:**
   - Browse materials marketplace
   - Add items to cart
   - View cart total

5. **Profile:**
   - View and edit profile
   - See followers/following
   - View user posts

## 🔄 Data Flow

1. **User Action** (e.g., like post)
2. **Frontend Call** → API Route
3. **Backend Processing** → Database Query
4. **Response** → Frontend State Update
5. **UI Render** with new data

## 📚 Available Commands

```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run seed            # Seed database with sample data
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
```

## 🚧 Future Enhancements

- [ ] Real-time messaging with WebSockets
- [ ] Image upload to cloud storage
- [ ] Payment integration for materials
- [ ] Rating and review system
- [ ] Project bidding system
- [ ] Notification system
- [ ] Admin dashboard
- [ ] Advanced search and filters
- [ ] Mobile app
- [ ] Email notifications

## 🐛 Troubleshooting

### Database Connection Issues
```bash
$env:DATABASE_URL='file:./prisma/dev.db'; npx prisma db push
```

### Clear Database and Reseed
```bash
# Delete dev.db and run
$env:DATABASE_URL='file:./prisma/dev.db'; npx prisma migrate dev --name init
$env:DATABASE_URL='file:./prisma/dev.db'; npx tsx ./prisma/seed.ts
```

### Port Already in Use
The dev server runs on port 3000. If it's already in use:
```bash
npm run dev -- -p 3001
```

## 📄 License

MIT License

## 🤝 Contributing

Contributions welcome! Please follow the existing code style and create feature branches.

---

**Built with ❤️ for the construction industry**
