import mongoose from 'mongoose';
import Project from './server/models/Project.js';
import Student from './server/models/Student.js';
import Staff from './server/models/Staff.js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project_management');
        console.log('Connected to DB');

        console.log('--- STAFF ---');
        const staff = await Staff.find().select('name email');
        console.log(JSON.stringify(staff, null, 2));

        console.log('--- STUDENTS ---');
        const students = await Student.find().select('name email createdByStaffId');
        console.log(JSON.stringify(students, null, 2));

        console.log('--- PROJECTS ---');
        const projects = await Project.find().select('title studentId assignedGuideId');
        console.log(JSON.stringify(projects, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
};

run();

// # Server Configuration
// PORT=5000
// NODE_ENV=development

// # MongoDB Connection
// MONGODB_URI=mongodb+srv://logeskumarr2004_db_user:1234@cluster0.pa1abpq.mongodb.net/?appName=Cluster0

// # JWT Secret (Change this to a random secure string in production)
// JWT_SECRET=loges123
// JWT_EXPIRE=7d

// # CORS Origin (Frontend URL)
// CLIENT_URL=http://localhost:5173




// EMAIL_SERVICE=gmail
// EMAIL_USER=logeskumarr2004@gmail.com
// EMAIL_PASS=zlkc qvvg ywrx uhvl


