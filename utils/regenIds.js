const fs = require('fs');
const { Types } = require('mongoose');

const path = 'utils/mockRooms.js';
let content = fs.readFileSync(path, 'utf8');
let count = 0;

content = content.replace(/_id:\s*"mock\d+"/g, () => {
    count++;
    return `_id: "${new Types.ObjectId().toString()}"`;
});

fs.writeFileSync(path, content);
console.log('replaced', count, 'ids');
