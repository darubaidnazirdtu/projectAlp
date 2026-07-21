import mongoose from 'mongoose';
import fs from 'fs';

const AparFormSchema = new mongoose.Schema({}, { strict: false });
const AparForm = mongoose.model('AparForm', AparFormSchema, 'aparforms');

async function test() {
    await mongoose.connect('mongodb://localhost:27017/apar');

    const form = await AparForm.findOne({ status: 'Accepted by Reviewing officer' }).lean();
    fs.writeFileSync('sample_form.json', JSON.stringify(form, null, 2));
    console.log("Exported sample_form.json");

    mongoose.disconnect();
}
test();
