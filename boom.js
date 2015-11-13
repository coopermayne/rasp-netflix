var sys = require('sys')
var exec = require('child_process').exec;
var child;
var mongoose = require('mongoose');
var fs = require('fs');
var ptn = require('parse-torrent-name');
var imdb = require('imdb-api');
var request = require('request');
var colors = require('colors');
var inquirer = require('inquirer');
var async = require('async');

var paused = false

//connect to db
mongoose.connect('mongodb://localhost/boom')
var db = mongoose.connection;

//set up movie Schema
var movieSchema = mongoose.Schema({
  file: {type: String, required: true},
  imdb_id: String,
  ptn_data: {},
  imdb_data: {}
})
var Movie = mongoose.model('Movie', movieSchema);


db.once('open', function (callback) {
  //scan through files and fill in db with info on them
  fs.readdir('../.', function(err, files){
    if(err) { throw err };
    function asyncLoop(i, callback){
      if(i >= files.length){return callback()}

      var file = files[i]
      file = file.replace('[kat\.cr]', '')
      var parsed_file = ptn(file)
      parsed_file.title = parsed_file.title.replace('torrent', '')

      //go to next file if current is not a torrent file
      if (!file.match(/.*\.torrent$/)) { return asyncLoop(i+1, callback) }

      //find or create document in collection
      Movie.find({file: file}, function (err, res) {
        var movieDoc = res[0] || new Movie({file: file})

        movieDoc.ptn_data = parsed_file

        movieDoc.save(function (err, movieDoc) {
          if(err) { throw err };
          asyncLoop(i+1, callback)
        })
      })
    }

    asyncLoop(0, getMovieData)
  });
});

function getMovieData() {
  Movie.find({ imdb_id: null, 'ptn_data.title':{$ne:null} }, function (err, movies) {
    console.log("todo: " + movies.length);

    function aloop(i, callback) {
      if(i >= movies.length){return callback()}

      var movie = movies[i]
      var ptn = movie.ptn_data

      async.series([

        function(next){
          // TRY SCRAPING KAT.CR
          var query = movie.file.replace('\.torrent', '')
          console.log('KAT: '.grey + query.grey);

          child = exec('ruby searchKat.rb \'' + query + '\'', function(error, stdout, stderr){
            if(stdout.match(/tt\d{7}/)){
              movie.imdb_id = stdout.match(/tt\d{7}/)[0]
              movie.save(function(){
                console.log("saved: " + movie.imdb_id.green);
                next(null, true)
              })
            } else {
              next(null, false)
            }
          })

        },

        function(next){
          // TRY SCRAPING GOOGLE (IF KAT DIDN'T WORK...)
          if(movie.imdb_id){return next(null, false)}

          //construct query
          var query = ptn.title
          query += ptn.year ? " " + ptn.year : ""
          query += " site:imdb.com"

          console.log('GOOGLE: '.grey + query.grey);

          child = exec('casperjs searchGoogle.js \'' + query + '\'', function(error, stdout, stderr){

            if(stdout.match(/tt\d{7}/)){

              movie.imdb_id = stdout.match(/tt\d{7}/)[0]

              movie.save(function(){
                console.log("saved: " + movie.imdb_id.green);
                next(null, true)
              })
            } else {
              next(null, false)
            }
          })

        },

        function(next){
          //look up imdb data (if there is an id)
          if(!movie.imdb_id){ 
            console.log("didn't find imdb id".red);
            return next(null, false); 
          }

          query = movie.imdb_id

          child = exec('ruby imdb.rb ' + query, function(error, stdout, stderr){
            if(error){ throw error; }
            if(stdout){
              movie.imdb_data = JSON.parse(stdout);
              movie.save(function(){
                var msg = movie.imdb_data.title
                msg += " (" + movie.imdb_data.year + ")"
                console.log('saved: ' + msg.green)
                next(null, false)
              })
            } else{
              console.log('no response!'.red);
              next(null, false)
            }
          })

        },

        function(next){
          //pause before next
          setTimeout(function(){
            next(null, true);
          }, 10000)
        }
      ], function(err, result){
        console.log(result);
        aloop(i+1, callback)
      })
  }
  // END aloop def

  aloop(0, function(){ console.log('done'); })

  })
}
