import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema, 'users');

async function test() {
    await mongoose.connect('mongodb://localhost:27017/apar');
    const user = await User.findOne({ user_id: 'pawansingh' }).lean();
    console.log(JSON.stringify(user, null, 2));
    mongoose.disconnect();
}
test();
