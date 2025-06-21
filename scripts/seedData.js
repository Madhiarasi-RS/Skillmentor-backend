const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Review = require('../models/Review');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await Review.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@learnifyhub.com',
      password: adminPassword,
      role: 'admin',
      isActive: true,
      emailVerified: true
    });

    console.log('👤 Created admin user');

    // Create sample students
    const studentPassword = await bcrypt.hash('student123', 12);
    const students = await User.create([
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: studentPassword,
        role: 'student',
        profile: {
          fatherName: 'Robert Doe',
          motherName: 'Jane Doe',
          education: 'Bachelor of Computer Science',
          university: 'Tech University',
          degree: 'B.Tech',
          major: 'Computer Science',
          yearOfCompletion: '2024',
          contactNo: '+1234567890',
          skills: ['JavaScript', 'React', 'Python', 'Node.js'],
          areasOfInterest: ['Web Development', 'Machine Learning', 'Data Science']
        },
        isActive: true,
        emailVerified: true
      },
      {
        name: 'Alice Smith',
        email: 'alice.smith@example.com',
        password: studentPassword,
        role: 'student',
        profile: {
          education: 'Master of Data Science',
          university: 'Data University',
          degree: 'M.Sc',
          major: 'Data Science',
          yearOfCompletion: '2023',
          contactNo: '+1234567891',
          skills: ['Python', 'Machine Learning', 'SQL', 'Tableau'],
          areasOfInterest: ['Artificial Intelligence', 'Data Analytics', 'Deep Learning']
        },
        isActive: true,
        emailVerified: true
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        password: studentPassword,
        role: 'student',
        profile: {
          education: 'Bachelor of Information Technology',
          university: 'IT College',
          degree: 'B.Tech',
          major: 'Information Technology',
          yearOfCompletion: '2025',
          contactNo: '+1234567892',
          skills: ['Java', 'Spring Boot', 'Angular', 'MySQL'],
          areasOfInterest: ['Backend Development', 'Cloud Computing', 'DevOps']
        },
        isActive: true,
        emailVerified: true
      }
    ]);

    console.log('👥 Created sample students');

    // Create sample courses
    const courses = await Course.create([
      {
        title: 'React Development Masterclass',
        description: 'Master React from basics to advanced concepts including hooks, context, and performance optimization. Build real-world projects and learn industry best practices.',
        instructor: 'Sarah Johnson',
        difficulty: 'Intermediate',
        duration: '8 weeks',
        category: 'Web Development',
        syllabus: [
          'React Fundamentals and JSX',
          'Components and Props',
          'State Management with Hooks',
          'Context API and Global State',
          'Performance Optimization',
          'Testing React Applications',
          'Deployment and Production'
        ],
        tags: ['React', 'JavaScript', 'Frontend', 'Web Development'],
        prerequisites: ['Basic JavaScript', 'HTML/CSS'],
        learningOutcomes: [
          'Build complex React applications',
          'Understand modern React patterns',
          'Implement state management solutions',
          'Optimize application performance'
        ],
        createdBy: admin._id
      },
      {
        title: 'Machine Learning Fundamentals',
        description: 'Learn the basics of machine learning with Python, covering algorithms, data preprocessing, and model evaluation. Perfect for beginners.',
        instructor: 'Dr. Michael Chen',
        difficulty: 'Beginner',
        duration: '10 weeks',
        category: 'Machine Learning',
        syllabus: [
          'Introduction to Machine Learning',
          'Data Preprocessing and Cleaning',
          'Supervised Learning Algorithms',
          'Unsupervised Learning Techniques',
          'Model Evaluation and Validation',
          'Feature Engineering',
          'Real-world ML Projects'
        ],
        tags: ['Machine Learning', 'Python', 'Data Science', 'AI'],
        prerequisites: ['Basic Python', 'Statistics'],
        learningOutcomes: [
          'Understand ML concepts and algorithms',
          'Implement ML models in Python',
          'Evaluate and improve model performance',
          'Apply ML to real-world problems'
        ],
        createdBy: admin._id
      },
      {
        title: 'Advanced JavaScript Concepts',
        description: 'Deep dive into advanced JavaScript concepts including closures, prototypes, async programming, and design patterns.',
        instructor: 'Alex Rodriguez',
        difficulty: 'Advanced',
        duration: '6 weeks',
        category: 'Programming',
        syllabus: [
          'Closures and Lexical Scope',
          'Prototypes and Inheritance',
          'Asynchronous Programming',
          'Design Patterns in JavaScript',
          'Memory Management',
          'Performance Optimization'
        ],
        tags: ['JavaScript', 'Advanced', 'Programming', 'ES6+'],
        prerequisites: ['Intermediate JavaScript', 'DOM Manipulation'],
        learningOutcomes: [
          'Master advanced JavaScript concepts',
          'Write efficient and maintainable code',
          'Understand JavaScript internals',
          'Implement complex programming patterns'
        ],
        createdBy: admin._id
      },
      {
        title: 'Python for Data Science',
        description: 'Complete guide to using Python for data science, including pandas, numpy, matplotlib, and scikit-learn.',
        instructor: 'Dr. Emily Davis',
        difficulty: 'Intermediate',
        duration: '12 weeks',
        category: 'Data Science',
        syllabus: [
          'Python Basics for Data Science',
          'NumPy for Numerical Computing',
          'Pandas for Data Manipulation',
          'Data Visualization with Matplotlib',
          'Statistical Analysis',
          'Introduction to Scikit-learn',
          'Data Science Projects'
        ],
        tags: ['Python', 'Data Science', 'Pandas', 'NumPy'],
        prerequisites: ['Basic Python'],
        learningOutcomes: [
          'Manipulate and analyze data with Python',
          'Create compelling data visualizations',
          'Perform statistical analysis',
          'Build data science pipelines'
        ],
        createdBy: admin._id
      },
      {
        title: 'Full Stack Web Development',
        description: 'Learn to build complete web applications using modern technologies including React, Node.js, Express, and MongoDB.',
        instructor: 'Mark Thompson',
        difficulty: 'Intermediate',
        duration: '16 weeks',
        category: 'Web Development',
        syllabus: [
          'Frontend Development with React',
          'Backend Development with Node.js',
          'Database Design with MongoDB',
          'RESTful API Development',
          'Authentication and Authorization',
          'Deployment and DevOps',
          'Full Stack Project'
        ],
        tags: ['Full Stack', 'React', 'Node.js', 'MongoDB'],
        prerequisites: ['HTML/CSS', 'JavaScript'],
        learningOutcomes: [
          'Build complete web applications',
          'Understand full stack architecture',
          'Implement user authentication',
          'Deploy applications to production'
        ],
        createdBy: admin._id
      },
      {
        title: 'Mobile App Development with React Native',
        description: 'Create cross-platform mobile applications using React Native. Learn to build apps for both iOS and Android.',
        instructor: 'Lisa Wang',
        difficulty: 'Intermediate',
        duration: '10 weeks',
        category: 'Mobile Development',
        syllabus: [
          'React Native Fundamentals',
          'Navigation and Routing',
          'State Management in Mobile Apps',
          'Native Device Features',
          'Performance Optimization',
          'App Store Deployment'
        ],
        tags: ['React Native', 'Mobile', 'iOS', 'Android'],
        prerequisites: ['React', 'JavaScript'],
        learningOutcomes: [
          'Build cross-platform mobile apps',
          'Understand mobile app architecture',
          'Integrate native device features',
          'Deploy apps to app stores'
        ],
        createdBy: admin._id
      }
    ]);

    console.log('📚 Created sample courses');

    // Create sample enrollments
    const enrollments = await Enrollment.create([
      {
        student: students[0]._id,
        course: courses[0]._id,
        progress: 65,
        completedModules: [
          { moduleIndex: 0, completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          { moduleIndex: 1, completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
          { moduleIndex: 2, completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
        ],
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      },
      {
        student: students[0]._id,
        course: courses[1]._id,
        progress: 100,
        completedModules: [
          { moduleIndex: 0, completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
          { moduleIndex: 1, completedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000) },
          { moduleIndex: 2, completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
          { moduleIndex: 3, completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
          { moduleIndex: 4, completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) }
        ],
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        completionDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      },
      {
        student: students[1]._id,
        course: courses[1]._id,
        progress: 80,
        completedModules: [
          { moduleIndex: 0, completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
          { moduleIndex: 1, completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
          { moduleIndex: 2, completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
          { moduleIndex: 3, completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }
        ],
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        student: students[1]._id,
        course: courses[3]._id,
        progress: 45,
        completedModules: [
          { moduleIndex: 0, completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
          { moduleIndex: 1, completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
        ],
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        student: students[2]._id,
        course: courses[4]._id,
        progress: 30,
        completedModules: [
          { moduleIndex: 0, completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }
        ],
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.log('📝 Created sample enrollments');

    // Create sample reviews
    const reviews = await Review.create([
      {
        student: students[0]._id,
        course: courses[1]._id,
        rating: 5,
        comment: 'Excellent course! Really helped me understand machine learning concepts deeply. The instructor explains everything clearly and the hands-on projects were very valuable.',
        isApproved: true
      },
      {
        student: students[1]._id,
        course: courses[1]._id,
        rating: 4,
        comment: 'Great course content and well-structured. Could use more advanced topics but perfect for beginners. Highly recommended!',
        isApproved: true
      },
      {
        student: students[0]._id,
        course: courses[0]._id,
        rating: 5,
        comment: 'Amazing React course! Covers everything from basics to advanced concepts. The projects helped me build a strong portfolio.',
        isApproved: true
      },
      {
        student: students[2]._id,
        course: courses[4]._id,
        rating: 4,
        comment: 'Comprehensive full stack course. Lots of content to cover but very thorough. Great for building real-world applications.',
        isApproved: true
      }
    ]);

    console.log('⭐ Created sample reviews');

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Admin users: 1`);
    console.log(`- Students: ${students.length}`);
    console.log(`- Courses: ${courses.length}`);
    console.log(`- Enrollments: ${enrollments.length}`);
    console.log(`- Reviews: ${reviews.length}`);
    console.log('\n🔐 Login credentials:');
    console.log('Admin: admin@learnifyhub.com / admin123');
    console.log('Student: john.doe@example.com / student123');
    console.log('Student: alice.smith@example.com / student123');
    console.log('Student: bob.johnson@example.com / student123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();