const fs = require('fs');
const path = 'c:/Users/Johnn/bykelink-system/functions/index.js';
const s = fs.readFileSync(path, 'utf8');
const stack = [];
let inString = null;
let escape = false;
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  const next = s[i + 1] || '';
  if (inString) {
    if (escape) {
      escape = false;
    } else if (ch === '\\') {
      escape = true;
    } else if (ch === inString) {
      inString = null;
    }
    continue;
  }
  if (ch === '/' && next === '/') {
    while (i < s.length && s[i] !== '\n') i++;
    continue;
  }
  if (ch === '/' && next === '*') {
    i += 2;
    while (i + 1 < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++;
    i++;
    continue;
  }
  if (ch === '"' || ch === "'" || ch === '`') {
    inString = ch;
    continue;
  }
  if (ch === '{' || ch === '[' || ch === '(') {
    stack.push(ch);
  } else if (ch === '}' || ch === ']' || ch === ')') {
    const pair = { '}': '{', ']': '[', ')': '(' }[ch];
    if (!stack.length || stack[stack.length - 1] !== pair) {
      console.log('MISMATCH', { ch, index: i, top: stack[stack.length - 1], stackTail: stack.slice(-10) });
      process.exit(1);
    }
    stack.pop();
  }
}
console.log('remaining stack length', stack.length);
console.log('remaining stack tail', JSON.stringify(stack.slice(-20)));
console.log('tail', JSON.stringify(s.slice(-300)));
