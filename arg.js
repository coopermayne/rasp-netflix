var mongoose = require('mongoose');
var fs = require('fs');
var ptn = require('parse-torrent-name');
var imdb = require('imdb-api');
var request = require('request');
var colors = require('colors');


//connect to db
mongoose.connect('mongodb://localhost/boom')
var db = mongoose.connection;

//set up movie Schema
var movieSchema = mongoose.Schema({
  file: {type: String, required: true},
  imdb_id: {type: String, match: /tt\d{7}/},
  ptn_data: {
    title: String,
    year: Number,
    season: Number,
    episode: Number,
    resolution: String,
    quality: String,
    codec: String,
    group: String,
    audio: String,
    language: String,
    hardcoded: Boolean
  },
});

var Movie = mongoose.model('Movie', movieSchema);

Movie.create({imdb_id: 'tt1234567'}, function(err, movie){
  if(err) {throw err; }

  console.log('saved');
});



//Movie.find({imdb_id: 'tt1234123'})
