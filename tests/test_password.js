const bcrypt = require('bcryptjs');
const enteredPassword = 'admin321'; // Replace with the input password
const storedHash = '$2a$10$ma.ilf5tNQbwd6xgbV4lM.6ieCTvt63dvv3j2Fa7ECV9tSA/4RAQe'; // Replace with your hash

bcrypt.compare(enteredPassword, storedHash, (err, result) => {
  if (err) throw err;
  console.log('Password Match:', result); // This should print true if the password is correct
});