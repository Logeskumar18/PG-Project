import mongoose from 'mongoose';
import Project from './models/Project.js';
import Student from './models/Student.js';
import Staff from './models/Staff.js';
import dotenv from 'dotenv';
dotenv.config();

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
