# 💬 Chat App

A full-stack real-time chat application built with **React, Node.js, Express, MongoDB, and Socket.IO**. The application provides authenticated one-to-one conversations, message requests, image sharing, profile management, and real-time updates.

## 🚀 Live Demo

**[Open Chat App](https://chat-app-cezq.onrender.com/)**

> The application is deployed on Render.

## ✨ Features

- 🔐 User registration and login
- 🔑 JWT-based authentication with protected routes
- 🔒 Password hashing with bcrypt
- 💬 One-to-one real-time messaging with Socket.IO
- 🔎 Search users by name, username, email, or user ID
- 📩 Message request system for users who have not connected before
- ✅ Accept, reject, and delete message requests
- 🖼️ Image sharing with Cloudinary
- ⚡ Real-time image upload progress/error events
- 📋 Inbox/chat list with last-message ordering
- 🗑️ Delete sent messages
- 👤 Update profile picture
- 🚪 Logout and account deletion
- 🔄 Real-time contact/message/request updates
- 📱 Responsive frontend UI

## 🛠️ Tech Stack

### Frontend

- React 19
- React Router
- Axios
- Zustand
- Socket.IO Client
- Tailwind CSS
- DaisyUI
- Framer Motion
- Lucide React
- React Window
- React Hot Toast
- Vite

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JSON Web Token (JWT)
- bcryptjs
- Cloudinary
- Cookie Parser
- CORS
- dotenv

The frontend and backend dependencies are defined separately in `frontend/package.json` and `backend/package.json`. 

## 🏗️ Project Architecture

```text
Chat_app/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── seeds/
│   │   └── index.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── Pages/
│   │   ├── store/
│   │   └── ...
│   ├── public/
│   └── package.json
│
└── README.md
```

## 🔄 How Messaging Works

The application uses Socket.IO for real-time communication while MongoDB stores persistent chat data.

```text
User A
  │
  │ HTTP / Socket.IO
  ▼
React Frontend
  │
  ▼
Express + Node.js
  │
  ├── JWT Authentication
  ├── Message Request Logic
  ├── Socket.IO Events
  └── Cloudinary Image Uploads
  │
  ▼
MongoDB / Mongoose
```

When a user sends a message, the backend stores the message and, when the receiver is connected, emits the appropriate Socket.IO event to the receiver. New contacts are handled through the message-request workflow before they become regular inbox contacts.

## 🔐 Authentication

Authentication is implemented using **JWT stored in an HTTP cookie**.

The authentication flow is:

1. A user signs up with name, email, and password.
2. The password is hashed using `bcryptjs`.
3. The backend generates a JWT.
4. Protected requests are validated through authentication middleware.
5. Users can log out by clearing the authentication cookie.

## 📩 Message Request System

To avoid allowing unsolicited direct conversations, the application checks whether two users are already connected.

```text
New User → Send First Message
              │
              ▼
        Already Connected?
          /           \
        Yes            No
         │              │
         ▼              ▼
   Direct Message   Message Request
                        │
                ┌───────┴───────┐
                ▼               ▼
             Accept           Reject
                │
                ▼
          Add to Inbox
```

This workflow is implemented through `MessageRequest` and `UserInbox` models and corresponding controllers.

## 🖼️ Image Uploads

Images are uploaded through **Cloudinary**. The backend stores the resulting secure image URL with the message and uses Socket.IO events to communicate upload progress and upload errors to connected clients.

## ⚙️ Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/AlokSharma13/Chat_app.git
cd Chat_app
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `backend` directory using `.env.example` as a reference.

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 5. Start the backend

```bash
cd backend
npm run dev
```

### 6. Start the frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

The Vite development server will provide the local frontend URL.

## 📜 Available Scripts

### Backend

```bash
npm run dev    # Start with Nodemon
npm start      # Start the production server
```

### Frontend

```bash
npm run dev      # Start Vite development server
npm run build    # Create production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🔒 Environment Variables

The repository includes `backend/.env.example` with the required configuration for MongoDB, JWT, Render, and Cloudinary. Never commit your real `.env` file or production secrets.

## 📌 Future Improvements

Potential improvements include:

- Typing indicators
- Read receipts
- Group conversations
- Push notifications
- Additional message reactions
- More granular message privacy/visibility controls

## 👨‍💻 Author

**Alok Sharma**

GitHub: [AlokSharma13](https://github.com/AlokSharma13)

## 📄 License

This project is available for educational and portfolio purposes.
