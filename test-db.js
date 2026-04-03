const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT id, name, image, "profileImageKey" FROM "user"')
  .then(res => {
    console.log(res.rows);
  })
  .catch(err => {
    console.error(err);
  })
  .finally(() => {
    pool.end();
  });
