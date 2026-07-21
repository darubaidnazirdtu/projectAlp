import mongoose from 'mongoose';

const AparFormSchema = new mongoose.Schema({}, { strict: false });
const AparForm = mongoose.model('AparForm', AparFormSchema, 'aparforms');

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema, 'users');

async function test() {
    await mongoose.connect('mongodb://localhost:27017/apar');

    const users = await User.find({ 
        $or: [
            { name: { $regex: /pawan/i } },
            { user_id: { $regex: /pawan/i } }
        ]
    }).lean();

    console.log(`Found ${users.length} users matching pawan:`);
    for (const u of users) {
        console.log(`- User ID: ${u.user_id}, Name: ${u.name}`);
        const forms = await AparForm.find({ user_id: u.user_id }).lean();
        console.log(`  -> Found ${forms.length} forms for this user.`);
        forms.forEach(f => console.log(`     Form ID: ${f._id}, Status: ${f.status}`));
    }

    mongoose.disconnect();
}
test();
