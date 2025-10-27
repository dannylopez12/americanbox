const bcrypt = require('bcrypt');

const password = 'password';
const rounds = 10;

bcrypt.hash(password, rounds).then(hash => {
  console.log(`Hash de '${password}':`, hash);
});
