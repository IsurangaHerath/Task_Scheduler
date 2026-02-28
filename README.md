# TaskFlow - Smart Task Scheduler & Reminder System

A full-stack web application for managing daily tasks, setting reminders, and organizing productivity with a beautiful soft light green UI theme.

![TaskFlow](https://img.shields.io/badge/TaskFlow-Task%20Scheduler-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)

## 🌟 Features

### Task Management
- ✅ Create, edit, and delete tasks
- ✅ Mark tasks as completed
- ✅ Set priority levels (Low, Medium, High)
- ✅ Categorize tasks by custom categories
- ✅ Set due dates and times
- ✅ Drag and drop reordering

### Organization
- 📅 Today's Tasks view
- 📆 Upcoming Tasks view
- ✅ Completed Tasks history
- 🗓️ Calendar view (Month, Week, Day)
- 🔍 Search and filter tasks

### Productivity
- 📊 Dashboard with statistics
- 📈 Weekly productivity chart
- 📉 Progress tracking
- 🔔 Browser notifications
- 📧 Email reminders (optional)

### User Experience
- 🎨 Beautiful light green theme
- 🌙 Dark mode support
- 📱 Fully responsive design
- ⚡ Fast and smooth animations
- 🔐 Secure authentication

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Context API** for state management
- **Axios** for API calls
- **Framer Motion** for animations
- **Recharts** for charts
- **React Big Calendar** for calendar view
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Nodemailer** for emails
- **node-cron** for scheduled tasks

## 📁 Project Structure

```
task-scheduler/
├── server/                 # Backend
│   ├── config/            # Configuration files
│   │   └── db.js          # Database connection
│   ├── controllers/       # Route controllers
│   │   ├── authController.js
│   │   └── taskController.js
│   ├── middleware/        # Express middleware
│   │   ├── auth.js        # JWT authentication
│   │   ├── errorHandler.js
│   │   └── validate.js    # Request validation
│   ├── models/            # Mongoose models
│   │   ├── User.js
│   │   └── Task.js
│   ├── routes/            # API routes
│   │   ├── authRoutes.js
│   │   └── taskRoutes.js
│   ├── services/          # Business logic
│   │   ├── emailService.js
│   │   └── reminderService.js
│   ├── .env.example       # Environment template
│   ├── package.json
│   └── server.js          # Entry point
│
├── client/                # Frontend
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── common/   # Shared components
│   │   │   ├── dashboard/
│   │   │   └── tasks/
│   │   ├── context/      # React Context
│   │   │   ├── AuthContext.jsx
│   │   │   ├── TaskContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-scheduler
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   cp .env.example .env
   # Edit .env if needed
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/task-scheduler
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CLIENT_URL=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=TaskFlow
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| POST | /api/auth/logout | Logout user |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| PUT | /api/auth/password | Change password |
| GET/PUT | /api/auth/settings | User settings |

### Task Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | Get all tasks |
| GET | /api/tasks/today | Get today's tasks |
| GET | /api/tasks/upcoming | Get upcoming tasks |
| GET | /api/tasks/completed | Get completed tasks |
| GET | /api/tasks/stats | Get statistics |
| GET | /api/tasks/calendar | Get calendar tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| PATCH | /api/tasks/:id/complete | Toggle complete |
| PUT | /api/tasks/reorder | Reorder tasks |

## 🎨 Design System

### Colors
- **Primary Light**: #A8E6CF (Soft Light Green)
- **Primary Dark**: #6BCB77 (Darker Green)
- **Background**: #F5FBF7 (Very Light Green)
- **Text Primary**: #1B4332 (Dark Green)
- **Text Secondary**: #40916C (Medium Green)

### Priority Colors
- **Low**: #A8E6CF
- **Medium**: #FFD93D
- **High**: #FF6B6B

## 📱 Screenshots

### Dashboard
The main dashboard shows task statistics, progress, and weekly productivity charts.

### Today's Tasks
View and manage all tasks scheduled for today with priority indicators.

### Calendar View
Interactive calendar with month, week, and day views for better planning.

### Settings
Customize your profile, notifications, and appearance preferences.

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Input validation
- CORS configuration
- Rate limiting ready

## 🚀 Deployment

### Backend (Render/Railway/Heroku)
1. Set environment variables
2. Deploy from GitHub
3. Ensure MongoDB Atlas connection

### Frontend (Vercel/Netlify)
1. Set environment variables
2. Deploy from GitHub
3. Configure redirects for SPA

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- Fonts from [Google Fonts](https://fonts.google.com/)
- Inspired by modern productivity apps

---

Made with 💚 by TaskFlow Team
