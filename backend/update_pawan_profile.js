import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema, 'users');

async function updateProfile() {
    await mongoose.connect('mongodb://localhost:27017/apar');

    const updateData = {
        name: "Dr. Pawan Singh Mehra",
        designation: "Assistant Professor",
        department_id: "CSE",
        date_of_birth: new Date("1987-11-26T00:00:00.000Z"),
        joining_date: new Date("2020-12-24T00:00:00.000Z"),
        grade: "Level 10",
        sc_st_status: "General"
    };

    const res = await User.updateOne(
        { user_id: 'pawansingh' },
        { $set: updateData }
    );

    console.log("Updated profile:", res);

    mongoose.disconnect();
}
updateProfile().catch(console.error);
