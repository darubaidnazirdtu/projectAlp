
const cleanEmptyStrings = (obj) => {
    if (obj !== Object(obj)) return obj; // Primitive
    if (Array.isArray(obj)) {
        return obj.map(item => cleanEmptyStrings(item));
    }
    const newObj = {};
    for (const key in obj) {
        const val = obj[key];
        if (val === '') {
            newObj[key] = undefined;
        } else if (val && typeof val === 'object') {
            newObj[key] = cleanEmptyStrings(val);
        } else {
            newObj[key] = val;
        }
    }
    return newObj;
};

const testData = {
    research: {
        journals: [
            {
                title: "Test Journal",
                author_names: "",
                year_of_publication: "2024",
                details: {
                    vol: ""
                }
            }
        ]
    }
};

const cleaned = cleanEmptyStrings(testData);
console.log(JSON.stringify(cleaned, null, 2));
