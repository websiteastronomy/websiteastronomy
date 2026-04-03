import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts';

async function main() {
  const allUsers = await db.select({
    name: users.name,
    image: users.image,
    profileImageKey: users.profileImageKey,
    isPublic: users.isPublic
  }).from(users);
  console.log(JSON.stringify(allUsers, null, 2));
}

main().catch(console.error);
