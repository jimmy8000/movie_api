const jwt = require('jsonwebtoken') // Importing the jsonwebtoken library

const jwtSecret = 'your_jwt_secret'; // This has to be the same key used in the JWTStrategy

  passport = require('passport'); // Importing the passport library

require('./passport'); // Importing the local passport file


let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, // Encoding the username in the JWT
    expiresIn: '7d', // Token will expire in 7 days
    algorithm: 'HS256' // Algorithm used to sign or encode the JWT values
  });
}


/* POST login. */
module.exports = (router) => {
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({
          message: 'Something is not right', // Error message if authentication fails
          user: user
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error); // Sending error response if login fails
        }
        let token = generateJWTToken(user.toJSON()); // Generating JWT token
        return res.json({ user, token }); // Sending user and token as response
      });
    })(req, res);
  });
}
