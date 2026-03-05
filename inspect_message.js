import mongoose from 'mongoose';
import Message from './server/models/Message.js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project_management');
        console.log('Connected to DB');

        const msgs = await Message.find()
            .sort({ createdAt: -1 })
            .limit(1)
            .lean();

        console.log(JSON.stringify(msgs, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
};

run();
