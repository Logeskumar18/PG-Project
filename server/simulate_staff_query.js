import mongoose from 'mongoose';
import Project from './models/Project.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project_management');
        console.log('Connected to DB');

        // ID for 'vijay' from previous inspection
        const staffIdVal = '6943cf81ea217aaa49f42b65';

        console.log(`Querying for assignedGuideId: ${staffIdVal}`);

        // 1. String query
        const projectsString = await Project.find({ assignedGuideId: staffIdVal });
        console.log(`Found (String match): ${projectsString.length}`);

        // 2. ObjectId query
        const staffObjectId = new mongoose.Types.ObjectId(staffIdVal);
        const projectsObject = await Project.find({ assignedGuideId: staffObjectId });
        console.log(`Found (ObjectId match): ${projectsObject.length}`);

        if (projectsObject.length > 0) {
            console.log('Sample Project:', projectsObject[0]);
        } else {
            // Check ALL projects and their guide IDs
            const all = await Project.find({}, 'assignedGuideId title');
            console.log('ALL Projects Guide IDs:');
            all.forEach(p => {
                console.log(`- ${p.title}: ${p.assignedGuideId} (Type: ${typeof p.assignedGuideId})`);
                if (p.assignedGuideId && p.assignedGuideId.toString() === staffIdVal) {
                    console.log('  MATCH FOUND via toString()!');
                }
            });
        }

    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
};

run();
