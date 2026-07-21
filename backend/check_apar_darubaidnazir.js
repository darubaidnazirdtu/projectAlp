import mongoose from 'mongoose';

const AparFormSchema = new mongoose.Schema({}, { strict: false });
const AparForm = mongoose.model('AparForm', AparFormSchema, 'aparforms');

async function test() {
    await mongoose.connect('mongodb://localhost:27017/apar');

    const forms = await AparForm.find({ user_id: { $regex: /darubaidnazir/i } }).lean();
    console.log(`Found ${forms.length} forms for user matching darubaidnazir:`);
    forms.forEach(f => console.log(`- ID: ${f._id}, Status: ${f.status}, User: ${f.user_id}`));

    mongoose.disconnect();
}
test();
