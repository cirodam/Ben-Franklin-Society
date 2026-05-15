import { db } from '../src/lib/server/db.js';

console.log('Deliberation Rules:');
console.log(db.prepare('SELECT * FROM deliberation_rule').all());

console.log('\nVote Rules:');
console.log(db.prepare('SELECT * FROM vote_rule').all());
