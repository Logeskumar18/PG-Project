import mongoose from 'mongoose';
import Project from './models/Project.js';
import Student from './models/Student.js';
import Staff from './models/Staff.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project_management');

        const staff = await Staff.find().lean();
        console.log('--- STAFF (' + staff.length + ') ---');
        staff.forEach(s => console.log(`ID: ${s._id} | Name: ${s.name} | Role: ${s.role}`));

        const projects = await Project.find().lean();
        console.log('\n--- PROJECTS (' + projects.length + ') ---');
        projects.forEach(p => console.log(`ID: ${p._id} | Title: ${p.title} | Guide: ${p.assignedGuideId}`));

        const students = await Student.find().lean();
        console.log('\n--- STUDENTS (' + students.length + ') ---');
        students.forEach(s => console.log(`ID: ${s._id} | Name: ${s.name} | CreatedBy: ${s.createdByStaffId}`));

    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
};

run();
