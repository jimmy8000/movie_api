const express = require('express'),
  morgan = require('morgan'),
  fs = require('fs'),
  path = require('path');

const app = express();

app.use(morgan("combined"));

app.get('/movies', (req, res) => {
  res.json({ topMovies });
});

app.get('/', (req, res) => {
  res.send('This is a root folder');
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong');
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
