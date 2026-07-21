import mongoose from 'mongoose';

const AparFormSchema = new mongoose.Schema({}, { strict: false });
const AparForm = mongoose.model('AparForm', AparFormSchema, 'aparforms');

async function test() {
    await mongoose.connect('mongodb://localhost:27017/apar');

    const form = await AparForm.findById('6a5de87435c4e5b63aa96c1b').lean();
    console.log(JSON.stringify(form, null, 2));

    mongoose.disconnect();
}
test();
