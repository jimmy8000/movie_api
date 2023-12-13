const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');

const app = express();

app.use(bodyParser.json());

app.use(express.static('public'));

let movies = [
  {
    id: 1,
    title: 'The Shawshank Redemption',
    genre: 'Drama',
    releaseYear: 1994,
    director: 'Frank Darabont',
  },
  {
    id: 2,
    title: 'The Godfather',
    genre: 'Crime',
    releaseYear: 1972,
    director: 'Francis Ford Coppola',
  },
  {
    id: 3,
    title: 'The Dark Knight',
    genre: 'Action',
    releaseYear: 2008,
    director: 'Christopher Nolan',
  },
];

app.get('/movies', (req, res) => {
  res.json(movies);
});

app.get('/movies/:id', (req, res) => {
  const movieId = req.params.id;
  const movie = movies.find((movie) => movie.id === parseInt(movieId));

  if (movie) {
    res.json(movie);
  } else {
    res.status(404).json({ error: 'Movie not found' });
  }
});


app.post('/movies', (req, res) => {
  let newMovie = req.body;

  if (!newMovie || !newMovie.title) {
    const message = 'Missing movie title';
    res.status(400).json({ error: message });
  } else {
    newMovie.id = uuid.v4();
    movies.push(newMovie);
    res.status(201).json(newMovie);
  }
});


app.put('/movies/:id', (req, res) => {
  const movieId = req.params.id;
  const movie = movies.find((movie) => movie.id === parseInt(movieId));
  if (movie) {
    movie.title = req.body.title || movie.title;
    movie.genre = req.body.genre || movie.genre;
    movie.releaseYear = req.body.releaseYear || movie.releaseYear;
    movie.director = req.body.director || movie.director;

    res.status(200).json(movie);
  } else {
    res.status(404).json({ error: 'Movie not found' });
  }
});

app.delete('/movies/:id', (req, res) => {
  const movieId = req.params.id;
  const movie = movies.find((m) => m.id === parseInt(movieId));

  if (movie) {
    movies = movies.filter((m) => m.id !== movieId);
    res.status(204).send(); 
  } else {
    res.status(404).json({ error: 'Movie not found' });
  }
});


app.listen(8080, () => {
  console.log('listening on 8080');
});
