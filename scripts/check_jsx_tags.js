import fs from 'fs';
const path = 'components/InputForm.tsx';
const sFull = fs.readFileSync(path, 'utf8');
// Extract only the JSX returned from the component to avoid matching TypeScript generics
const retIdx = sFull.indexOf('\n    return (');
let s = sFull;
if (retIdx !== -1) {
	// find matching closing paren for return (
	let i = retIdx + '\n    return ('.length - 1;
	let depth = 0;
	for (; i < sFull.length; i++) {
		const ch = sFull[i];
		if (ch === '(') depth++;
		else if (ch === ')') { depth--; if (depth === 0) { i++; break; } }
	}
	s = sFull.substring(retIdx + '\n    return ('.length - 1, i);
}
const regex = /<(\/)?([A-Za-z0-9_-]+)([^>]*)>/g;
const selfClosingTags = new Set(['input','img','br','hr','meta','link','svg','path']);
let match;
const stack = [];
const lines = s.split('\n');
function locFromIndex(idx){
	let line = 0, col = 0, acc = 0;
	for(let i=0;i<lines.length;i++){
		const l = lines[i];
		if(acc + l.length + 1 > idx){ line = i+1; col = idx-acc+1; break; }
		acc += l.length + 1;
	}
	return {line,col};
}

const errors = [];
while((match = regex.exec(s))){
	const isClose = !!match[1];
	const tag = match[2];
	const attrs = match[3] || '';
	const raw = match[0];
	const idx = match.index;
	const loc = locFromIndex(idx);
	if(tag === '>' || tag === '!') continue;
	if(tag === 'React.Fragment' || tag === 'Fragment') continue;
	if(tag.startsWith('#')) continue;
	const isComponent = tag[0] && tag[0] === tag[0].toUpperCase();
	const selfCloseAttr = /\/\s*>$/.test(raw) || /\/\s*>/.test(attrs);
	if(selfClosingTags.has(tag.toLowerCase()) || selfCloseAttr) continue;
	if(isClose){
		if(stack.length === 0 || stack[stack.length-1].tag !== tag){
			errors.push(`Mismatch close </${tag}> at ${loc.line}:${loc.col}. Stack top: ${stack.length ? stack[stack.length-1].tag + '@' + stack[stack.length-1].loc.line + ':' + stack[stack.length-1].loc.col : '<empty>'}`);
		} else { stack.pop(); }
	} else {
		if(isComponent) continue;
		stack.push({tag, loc});
	}
}
if(stack.length > 0){
	errors.push('Unclosed tags at EOF: ' + stack.map(s => s.tag + '@' + s.loc.line + ':' + s.loc.col).join(', '));
}
if(errors.length>0){
	console.error('Errors:\n' + errors.join('\n'));
	process.exit(1);
}
console.log('All tags matched');