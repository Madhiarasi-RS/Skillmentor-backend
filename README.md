# LearnifyHub Backend API

A comprehensive backend API for the LearnifyHub AI-powered learning platform built with Node.js, Express, and MongoDB Atlas.

## Features

- **User Authentication & Authorization** - JWT-based auth with role-based access control
- **Course Management** - CRUD operations for courses with advanced filtering
- **Enrollment System** - Student enrollment and progress tracking
- **Review System** - Course reviews with moderation capabilities
- **Admin Dashboard** - Comprehensive analytics and management tools
- **File Upload** - Support for images and documents
- **Data Validation** - Input validation and sanitization
- **Security** - Rate limiting, CORS, helmet, and more
- **Error Handling** - Centralized error handling with detailed logging

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **ODM**: Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/learnifyhub?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8080
```

5. Create uploads directory:
```bash
mkdir uploads
```

6. Seed the database (optional):
```bash
npm run seed
```

7. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Update password
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/dashboard` - Get dashboard data
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID (Admin)
- `PUT /api/users/:id/status` - Update user status (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create course (Admin)
- `PUT /api/courses/:id` - Update course (Admin)
- `DELETE /api/courses/:id` - Delete course (Admin)
- `GET /api/courses/user/recommendations` - Get recommended courses

### Enrollments
- `POST /api/enrollments` - Enroll in course
- `GET /api/enrollments` - Get user enrollments
- `GET /api/enrollments/:id` - Get single enrollment
- `PUT /api/enrollments/:id/progress` - Update progress
- `DELETE /api/enrollments/:id` - Unenroll from course
- `GET /api/enrollments/course/:courseId` - Get enrollment by course

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/course/:courseId` - Get course reviews
- `GET /api/reviews/my-reviews` - Get user reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/helpful` - Mark review as helpful
- `POST /api/reviews/:id/report` - Report review

### Admin
- `GET /api/admin/dashboard` - Get admin dashboard stats
- `GET /api/admin/analytics/users` - Get user analytics
- `GET /api/admin/analytics/courses` - Get course analytics
- `GET /api/admin/reported-reviews` - Get reported reviews
- `PUT /api/admin/reviews/:id/moderate` - Moderate review

### Upload
- `POST /api/upload` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files

## Data Models

### User
- Personal information (name, email, password)
- Profile details (education, skills, interests)
- Role-based access (student/admin)
- Account status and verification

### Course
- Course details (title, description, instructor)
- Metadata (difficulty, duration, category)
- Content structure (syllabus, prerequisites)
- Status and creation info

### Enrollment
- Student-course relationship
- Progress tracking
- Module completion
- Timestamps and status

### Review
- Rating and comments
- Approval status
- Helpful votes and reports
- Moderation features

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Prevent API abuse
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Comprehensive data validation
- **Helmet Security** - Security headers
- **Role-based Access** - Admin/student permissions

## Error Handling

The API includes comprehensive error handling:
- Validation errors with detailed messages
- Database errors with appropriate status codes
- Authentication and authorization errors
- File upload errors
- Generic server errors with logging

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data
- `npm test` - Run tests (when implemented)

### Database Seeding

The seed script creates sample data including:
- Admin user (admin@learnifyhub.com / admin123)
- Sample students with profiles
- Various courses across categories
- Enrollments with progress
- Reviews and ratings

Run seeding:
```bash
npm run seed
```

## Deployment

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address
5. Get the connection string
6. Update MONGODB_URI in your environment

### Environment Variables

Ensure all required environment variables are set:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS

### Production Considerations

- Use strong JWT secrets
- Enable MongoDB Atlas IP whitelisting
- Set up proper logging
- Configure rate limiting
- Use HTTPS in production
- Set up monitoring and alerts

## API Documentation

For detailed API documentation with request/response examples, consider setting up:
- Swagger/OpenAPI documentation
- Postman collection
- API testing suite

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.