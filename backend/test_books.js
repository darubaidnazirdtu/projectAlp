import mongoose from 'mongoose';
import { Publication } from './src/models/publication.model.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const books = await Publication.find({ type: 'book' }).lean();
    console.log(JSON.stringify(books, null, 2));
    process.exit(0);
};

run().catch(console.error);
