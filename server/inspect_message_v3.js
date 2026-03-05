import mongoose from 'mongoose';
import Message from './models/Message.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project_management');
        console.log('Connected.');

        const msg = await Message.findOne().sort({ createdAt: -1 }).lean();
        console.log('MODEL:', msg.senderModel);
        console.log('ID:', msg.senderId.toString());

    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
};

run();
