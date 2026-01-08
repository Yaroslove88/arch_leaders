import * as bcrypt from 'bcrypt';

const password = process.argv[2] || 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then((hash) => {
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  process.exit(0);
});

