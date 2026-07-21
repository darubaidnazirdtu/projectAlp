import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema, 'users');

const AparFormSchema = new mongoose.Schema({}, { strict: false });
const AparForm = mongoose.model('AparForm', AparFormSchema, 'aparforms');

async function test() {
    await mongoose.connect('mongodb://localhost:27017/apar');

    const users = await User.find({ 
        $or: [
            { user_id: { $regex: /darubaidnazir/i } },
            { name: { $regex: /darubaidnazir/i } },
            { facultyName: { $regex: /darubaidnazir/i } },
            { email: { $regex: /darubaidnazir/i } }
        ]
    }).lean();

    console.log(`Found ${users.length} users matching darubaidnazir:`);
    for (const u of users) {
        console.log(`- User ID: ${u.user_id}, Name: ${u.name}`);
        const forms = await AparForm.find({ user_id: u.user_id }).lean();
        console.log(`  -> Found ${forms.length} forms for this user.`);
        forms.forEach(f => console.log(`     Form ID: ${f._id}, Status: ${f.status}`));
    }
    
    // Also check forms indiscriminately for any occurrence
    const allForms = await AparForm.find().lean();
    let count = 0;
    for (const f of allForms) {
        if (JSON.stringify(f).toLowerCase().includes('darubaidnazir')) {
            console.log(`Found darubaidnazir in form: ${f._id}, status: ${f.status}`);
            count++;
        }
    }
    if(count === 0) {
        console.log("No forms contain the string darubaidnazir anywhere.");
    }

    mongoose.disconnect();
}
test();
