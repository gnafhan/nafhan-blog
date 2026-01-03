# NafhanBlog

<div align="center">
  <img src="frontend/public/logo.png" alt="NafhanBlog Logo" width="120" height="120">
  
  <h3>A Modern Full-Stack Blog Platform</h3>
  <p>Share your stories, ideas, and knowledge with the world</p>

  ![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
  ![NestJS](https://img.shields.io/badge/NestJS-10-red?style=flat-square&logo=nestjs)
  ![MongoDB](https://img.shields.io/badge/MongoDB-7-green?style=flat-square&logo=mongodb)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
  ![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square&logo=docker)
</div>

---

## 🌐 Live Demo

This project is deployed on Ubuntu VPS:

| Service | URL |
|---------|-----|
| **Frontend** | [https://blog.nafhan.com/](https://blog.nafhan.com/) |
| **Backend API** | [https://be-blog.nafhan.com/](https://be-blog.nafhan.com/) |

---

## ✨ Features

### User Management
- 🔐 JWT-based authentication (Register/Login)
- 👤 User profile with customizable profile picture
- 🖼️ Profile picture upload with image validation

### Blog Posts
- 📝 Create, Read, Update, Delete (CRUD) blog posts
- 🎨 Rich text editor with formatting toolbar (bold, italic, headings, lists, code blocks)
- 🏷️ Category tagging for posts
- 🔍 Full-text search functionality
- 📄 Pagination for post listings
- 👏 Medium-style clap feature with animations

### Comments
- 💬 Add comments to posts
- ✏️ Edit and delete your own comments
- 👤 Author attribution with profile pictures

### UI/UX
- 🎨 Modern, responsive design with Tailwind CSS
- 🌙 Clean and intuitive interface
- 📱 Mobile-friendly layout
- ⚡ Fast page loads with Next.js App Router

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Rich Text Editor:** Lexical
- **State Management:** React Context API

### Backend
- **Framework:** NestJS 10
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (Passport.js)
- **File Upload:** Multer

### DevOps
- **Containerization:** Docker & Docker Compose
- **Development:** Hot reload for both frontend and backend

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm or yarn

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NafhanBlog
   ```

2. **Start with Docker Compose (Development)**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - MongoDB: localhost:27017

### Manual Setup

#### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run start:dev
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📁 Project Structure

```
NafhanBlog/
├── frontend/                 # Next.js frontend application
│   ├── app/                  # App Router pages
│   │   ├── auth/             # Authentication pages
│   │   ├── posts/            # Post pages (detail, edit, new)
│   │   └── profile/          # User profile page
│   ├── components/           # React components
│   │   ├── comments/         # Comment components
│   │   ├── editor/           # Rich text editor
│   │   ├── layout/           # Layout components
│   │   ├── posts/            # Post components
│   │   └── ui/               # UI components (shadcn)
│   ├── contexts/             # React contexts
│   ├── lib/                  # Utilities and API clients
│   └── public/               # Static assets
│
├── backend/                  # NestJS backend application
│   ├── src/
│   │   ├── auth/             # Authentication module
│   │   ├── comments/         # Comments module
│   │   ├── posts/            # Posts module
│   │   └── users/            # Users module
│   ├── test/                 # Test files
│   └── uploads/              # Uploaded files
│
├── docker-compose.yml        # Production Docker config
├── docker-compose.dev.yml    # Development Docker config
└── README.md
```

---

## 🔧 Environment Variables

### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://admin:password123@localhost:27017/blog_platform?authSource=admin

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server
PORT=3000
```

### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/auth/profile` | Get current user profile |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | Get all posts (paginated) |
| GET | `/posts/:id` | Get single post |
| POST | `/posts` | Create new post |
| PUT | `/posts/:id` | Update post |
| DELETE | `/posts/:id` | Delete post |
| POST | `/posts/:id/clap` | Add clap to post |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts/:id/comments` | Get comments for post |
| POST | `/posts/:id/comments` | Create comment |
| PUT | `/comments/:id` | Update comment |
| DELETE | `/comments/:id` | Delete comment |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/profile-picture` | Upload profile picture |

---

## 🐳 Docker Commands

```bash
# Development (with hot reload)
docker-compose -f docker-compose.dev.yml up -d

# Production
docker-compose up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop containers
docker-compose -f docker-compose.dev.yml down

# Rebuild containers
docker-compose -f docker-compose.dev.yml up -d --build
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test

# Backend e2e tests
npm run test:e2e
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Ghifari Nafhan Muhammad Zhafarizza**

---

<div align="center">
  <p>Built with ❤️ using Next.js, NestJS, and MongoDB</p>
</div>
