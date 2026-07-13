import mongoose from 'mongoose';

const AparFormSchema = new mongoose.Schema({}, { strict: false });
const AparForm = mongoose.model('AparForm', AparFormSchema, 'aparforms');
const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema, 'users');

async function test() {
    await mongoose.connect('mongodb://localhost:27017/apar');

    const currUserId = "darubaidnazir001"; // or whatever they logged in as
    
    // Check if anyone has darubaidnazir001 as reporting_officer_id
    const assignedUsers = await User.find({ reporting_officer_id: currUserId }).lean();
    console.log(`Users assigned to ${currUserId} as reporting officer:`);
    assignedUsers.forEach(u => console.log(`- user_id: ${u.user_id}`));

    // Check what the user darubaidnazir001 actually is
    const currUser = await User.find({ user_id: currUserId }).lean();
    console.log(`\nCurrent User Profile (${currUserId}):`);
    console.log(currUser[0]);

    // Show all users with a reporting officer
    const allAssigned = await User.find({ reporting_officer_id: { $ne: null } }).lean();
    console.log(`\nAll users that have a reporting officer assigned:`);
    allAssigned.forEach(u => console.log(`- user_id: ${u.user_id}, reporting: ${u.reporting_officer_id}`));

    mongoose.disconnect();
}
test();
