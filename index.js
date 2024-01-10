const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const uuid = require("uuid");
const mongoose = require("mongoose");
const Models = require("./models.js");
const bodyParser = require("body-parser");

const { check, validationResult } = require("express-validator");

const Movies = Models.Movie;
const Users = Models.User;

const cors = require("cors");
app.use(cors());

// mongoose.connect("mongodb://localhost:27017/cfDB", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

mongoose.connect( process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(bodyParser.urlencoded({ extended: true }));
let auth = require("./auth")(app);
app.use(express.static("public"));
const passport = require("passport");
require("./passport");

//Add a user

app.post(
  "/users",
  // Validation logic here for request
  //you can either use a chain of methods like .not().isEmpty()
  //which means "opposite of isEmpty" in plain english "is not empty"
  //or use .isLength({min: 5}) which means
  //minimum value of 5 characters are only allowed
  [
    check("Username", "Username is required").isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  async (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
      .then((user) => {
        if (user) {
          //If the user is found, send a response that it already exists
          return res.status(400).send(req.body.Username + " already exists");
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

//Add a movie
app.post("/movies", async (req, res) => {
  await Movies.findOne({ Title: req.body.Title })
    .then((movie) => {
      if (movie) {
        return res.status(400).send(req.body.Title + " already exists");
      } else {
        Movies.create({
          Title: req.body.Title,
          Description: req.body.Description,
          Genre: {
            Name: req.body.Genre.Name,
            Description: req.body.Genre.Description,
          },
          Director: {
            Name: req.body.Director.Name,
            Bio: req.body.Director.Bio,
          },
          Actors: [req.body.Actors],
          ImagePath: req.body.ImagePath,
          Featured: req.body.Featured,
        })
          .then((movie) => {
            res.status(201).json(movie);
          })
          .catch((err) => {
            console.error(err);
            res.status(500).send("Error: " + err);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//Get all movies
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movies.find()
      .then((movie) => {
        res.status(200).json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//Get all users
app.get("/users", async (req, res) => {
  await Users.find()
    .then((user) => {
      res.status(200).json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});
//Get a Movie by name
app.get(
  "/movies/:Title",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movies.findOne({ Title: req.params.Title })
      .then((movie) => {
        res.json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//Get a user by name
app.get("/users/:Username", async (req, res) => {
  await Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});
// Get description by genre
app.get(
  "/movies/genre/:Genre",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const genre = await Movies.findOne({ "Genre.Name": req.params.Genre });

      if (genre) {
        res.json(genre.Genre);
      } else {
        return res.status(404).send("Genre not found");
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: " + err.message);
    }
  }
);

//Get director data by director name
app.get(
  "/movies/director/:Director",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const director = await Movies.findOne({
        "Director.Name": req.params.Director,
      });
      if (director) {
        res.json(director.Director);
      } else {
        return res.status(404).send("Director not found");
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: " + err.message);
    }
  }
);

//Update users info by username
app.put(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send("Permission denied");
    }
    await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      { new: true }
    )
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//Add a movie to a user's favorites
app.post(
  "/users/:Username/Movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $push: { FavoriteMovies: req.params.MovieID },
      },
      { new: true }
    )
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Remove a movie from a user's favorites
app.delete(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const username = req.params.Username;
      const movieId = req.params.MovieID;
      const user = await Users.findOne({ Username: username });

      if (!user) {
        return res.status(404).send("User not found");
      }

      const index = user.FavoriteMovies.indexOf(movieId);
      if (index === -1) {
        return res.status(404).send("Movie not found in user's favorites");
      }

      user.FavoriteMovies.splice(index, 1);

      await user.save();

      res.status(200).json(user);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error: " + err.message);
    }
  }
);

//Delete a user by username
app.delete(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.findOneAndDelete({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found");
        } else {
          res.status(200).send(req.params.Username + " was deleted.");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});