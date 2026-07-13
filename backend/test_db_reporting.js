import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const AparFormSchema = new mongoose.Schema({}, { strict: false });
const AparForm = mongoose.model('AparForm', AparFormSchema, 'aparforms');

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);
    const forms = await AparForm.find({}).lean();
    console.log("All Forms:");
    forms.forEach(f => {
        console.log(`- faculty_id: ${f.faculty_id}, status: ${f.status}, reporting_officer_id: ${f.reporting_officer_id}`);
    });
    mongoose.disconnect();
}
test();
