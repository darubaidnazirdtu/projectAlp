import mongoose from 'mongoose';

const AparFormSchema = new mongoose.Schema({}, { strict: false });
const AparForm = mongoose.model('AparForm', AparFormSchema, 'aparforms');

async function updateDB() {
    await mongoose.connect('mongodb://localhost:27017/apar');

    // Update the submitted forms so that darubaidnazir001 is the reporting officer
    const res = await AparForm.updateMany(
        { status: 'Submitted' },
        { $set: { reporting_officer_id: 'darubaidnazir001' } }
    );
    console.log(`Updated ${res.modifiedCount} submitted forms to have darubaidnazir001 as reporting officer.`);

    mongoose.disconnect();
}
updateDB();
