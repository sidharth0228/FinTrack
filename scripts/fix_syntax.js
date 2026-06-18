const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/dashboard.html');
let content = fs.readFileSync(filePath, 'utf8');

// The problematic block
const badBlock = /cards\[3\]\.innerText = `₹\${monthlySavings\.toLocaleString\('en-IN', \{ minimumFractionDigits: 2 \}\)\}`;\s*\}\)\}`;\s*cards\[3\]\.innerText = `₹\${monthlySavings\.toLocaleString\('en-IN', \{ minimumFractionDigits: 2 \}\)\}`;/;

const fix = `cards[3].innerText = \`₹\${monthlySavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\`;`;

if (badBlock.test(content)) {
    content = content.replace(badBlock, fix);
    fs.writeFileSync(filePath, content);
    console.log('Fixed syntax error in dashboard.html');
} else {
    console.error('Bad block not found');
}
