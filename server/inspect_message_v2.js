import mongoose from 'mongoose';
import Message from './models/Message.js';
import Student from './models/Student.js';
import Staff from './models/Staff.js';
import HOD from './models/HOD.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project_management');
        console.log('Connected to DB');

        // Get raw message first to see senderModel
        const msg = await Message.findOne().sort({ createdAt: -1 }).lean();
        console.log('Raw Message:', {
            _id: msg._id,
            senderId: msg.senderId.toString(),
            senderModel: msg.senderModel,
            subject: msg.subject
        });

        // Try manual find
        let user;
        if (msg.senderModel === 'Student') user = await Student.findById(msg.senderId);
        if (msg.senderModel === 'Staff') user = await Staff.findById(msg.senderId);
        if (msg.senderModel === 'HOD') user = await HOD.findById(msg.senderId);

        console.log('Found User:', user ? { name: user.name, role: user.role } : 'NOT FOUND');

        // Try populate
        const popMsg = await Message.findById(msg._id).populate('senderId', 'name');
        console.log('Populated senderId:', popMsg.senderId);

    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
};

run();
