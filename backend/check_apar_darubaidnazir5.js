import mongoose from 'mongoose';

const AparFormSchema = new mongoose.Schema({}, { strict: false });
const AparForm = mongoose.model('AparForm', AparFormSchema, 'aparforms');

function findValueInObject(obj, value, path = '') {
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            findValueInObject(obj[key], value, path + '.' + key);
        } else if (typeof obj[key] === 'string' && obj[key].toLowerCase().includes(value)) {
            console.log(`Found "${value}" at path: ${path}.${key}`);
            console.log(`Value: ${obj[key]}`);
        }
    }
}

async function test() {
    await mongoose.connect('mongodb://localhost:27017/apar');

    const form = await AparForm.findById('6a5de87435c4e5b63aa96c1b').lean();
    findValueInObject(form, 'darubaidnazir');

    mongoose.disconnect();
}
test();
