const fs = require('fs');
const content = fs.readFileSync('/Users/deepanshuarora/BODHI/mobileApp_BODHI/src/screens/AIVoiceScreen.tsx', 'utf8');
const lines = content.split('\n');

let balance = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') balance++;
    if (line[j] === '}') balance--;
  }
  if (balance === 0 && i < 700) {
    console.log(`Potential closure at line ${i + 1}: ${line}`);
  }
}
console.log(`Final balance: ${balance}`);
