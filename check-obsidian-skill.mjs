import { getDb } from './server/db.js';
import { skills } from './drizzle/schema.js';
import { like } from 'drizzle-orm';

const db = await getDb();
const obsidianSkills = await db.select().from(skills).where(like(skills.name, '%Obsidian%'));
console.log(JSON.stringify(obsidianSkills, null, 2));
