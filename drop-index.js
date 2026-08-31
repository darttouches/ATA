import mongoose from 'mongoose';
import dbConnect from './src/lib/db.js';
import User from './src/models/User.js';

async function dropIndex() {
    await dbConnect();
    try {
        await User.collection.dropIndex('email_1');
        console.log("Successfully dropped 'email_1' index.");
    } catch (err) {
        console.error("Error dropping index:", err.message);
    }
    process.exit(0);
}
dropIndex();
