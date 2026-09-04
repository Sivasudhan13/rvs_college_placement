/**
 * Seed script — run with: npm run seed
 * Populates the DB with sample quizzes and one demo student.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const connectDB = require('../config/db');
const User      = require('../models/User');
const Quiz      = require('../models/Quiz');
const Task      = require('../models/Task');

const quizzes = [
  {
    title: 'TCS NQT Pattern Mock Test',
    category: 'Aptitude',
    difficulty: 'Medium',
    duration: 90,
    totalQuestions: 90,
    description: 'Full-length mock test covering quantitative, logical, and verbal reasoning.',
    tags: ['TCS', 'NQT', 'Aptitude'],
    questions: [
      {
        questionText: 'If a 9-digit number 985x3678y is divisible by 72, the value of (4x − 3y) is:',
        options: ['5', '4', '6', '3'],
        correctAnswer: 1,
        marks: 4,
        negativeMarks: 1,
        explanation: 'Divisibility by 72 = divisibility by 8 and 9.',
      },
      {
        questionText: 'A train travels 360 km at a uniform speed. If the speed had been 5 km/h more, it would have taken 1 hour less. Find the original speed.',
        options: ['40 km/h', '45 km/h', '36 km/h', '50 km/h'],
        correctAnswer: 0,
        marks: 4,
        negativeMarks: 1,
        explanation: 'Form equation: 360/v - 360/(v+5) = 1, solve for v.',
      },
    ],
  },
  {
    title: 'Core Java Concepts Quiz',
    category: 'Technical',
    difficulty: 'Easy',
    duration: 30,
    totalQuestions: 30,
    description: 'Test your understanding of OOPs, exception handling, and collections.',
    tags: ['Java', 'OOP', 'Technical'],
    questions: [
      {
        questionText: 'Which keyword is used to inherit a class in Java?',
        options: ['implements', 'extends', 'inherits', 'super'],
        correctAnswer: 1,
        marks: 2,
        negativeMarks: 0,
        explanation: 'The extends keyword is used for class inheritance in Java.',
      },
    ],
  },
  {
    title: 'Behavioral Interview Prep',
    category: 'HR / Soft Skills',
    difficulty: 'Medium',
    duration: 45,
    totalQuestions: 25,
    description: 'Scenario-based questions to prepare you for cultural fit interviews.',
    tags: ['HR', 'Behavioral', 'Soft Skills'],
    questions: [],
  },
  {
    title: 'Weekly DSA Contest',
    category: 'Coding',
    difficulty: 'Hard',
    duration: 120,
    totalQuestions: 5,
    description: 'Participate in the college-wide competitive programming contest.',
    tags: ['DSA', 'Competitive', 'Coding'],
    questions: [],
  },
];

const seedDB = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Quiz.deleteMany({});
  await Task.deleteMany({});

  // Let the pre('save') hook hash the password — pass plain text
  const student = await User.create({
    name:            'Alex Johnson',
    email:           'alex@rvscet.ac.in',
    studentId:       '21CSE001',
    password:        'password123',
    department:      'cse',
    role:            'student',
    admissionNumber: '21CSE001',
  });

  await User.create({
    name:            'Dr. Kumar',
    email:           'kumar@rvscet.ac.in',
    studentId:       'FAC001',
    password:        'password123',
    department:      'cse',
    role:            'faculty',
    admissionNumber: 'FAC001',
  });

  // Create admin
  await User.create({
    name:            'Admin',
    email:           'admin@rvscet.ac.in',
    studentId:       'ADMIN001',
    password:        'admin@123',
    department:      'cse',
    role:            'admin',
    admissionNumber: 'ADMIN001',
  });

  // Create quizzes
  await Quiz.insertMany(quizzes);

  // Create sample tasks for the student
  await Task.insertMany([
    { user: student._id, title: 'Submit OS Assignment 3',         category: 'Assignment', priority: 'High',   status: 'Todo',        dueDate: new Date(Date.now() + 86400000), description: 'Submit via the faculty portal before midnight.' },
    { user: student._id, title: 'Review Aptitude Test 4 results', category: 'Study',      priority: 'Medium', status: 'Todo',        dueDate: new Date(Date.now() + 172800000), description: 'Go over incorrect answers.' },
    { user: student._id, title: 'Update Resume on portal',        category: 'Career',     priority: 'Medium', status: 'Todo',        dueDate: new Date(Date.now() + 432000000), description: 'Add latest projects and certifications.' },
    { user: student._id, title: 'Complete DP module on IDE',      category: 'Practice',   priority: 'High',   status: 'In Progress', dueDate: new Date(Date.now() + 259200000), description: 'Finish all 12 problems.' },
    { user: student._id, title: 'Data Structures Mastery',        category: 'Study',      priority: 'Low',    status: 'Completed',   dueDate: new Date('2024-10-12'), description: 'All 45 questions solved.' },
  ]);

  console.log('✅  Database seeded successfully!');
  console.log('👤  Demo student — ID: 21CSE001      password: password123');
  console.log('👤  Demo faculty — ID: FAC001         password: password123');
  console.log('🔑  Admin        — ID: ADMIN001       password: admin@123');
  process.exit(0);
};

seedDB().catch((err) => { console.error(err); process.exit(1); });
