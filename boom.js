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
  imdb_id: String,
  ptn_data: {},
  imdb_data: {}
});
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

    asyncLoop(0, tagEntries)
  });
});

function tagEntries() {
  Movie.find({ imdb_id: null, 'ptn_data.title':{$ne:null} }, function (err, movies) {
    console.log("todo: " + movies.length);
    //set starting point...
    var i=0
    //set interval
    var intId = setInterval(function () {
      if(i >= movies.length) {clearInterval(intId); return;}
      var movie = movies[i]
      var ptn = movie.ptn_data

      //construct url
      var url = 'http://ajax.googleapis.com/ajax/services/search/web?v=1.0&q='
      url += ptn.title ? "+"+ ptn.title : ""
      url += ptn.year ? "+"+ ptn.year : ""
      url += "+site:imdb.com"
      url = url.replace(/\s/g,'+')

      console.log(url.grey);
      request(url, function (err, res, body) {
        if (err) { throw err; }
        var json_res = JSON.parse(res.body)

        if (json_res.responseData && json_res.responseData.results[0] && json_res.responseData.results[0].url.match(/tt\d{7}/) ) {
          movie.imdb_id = json_res.responseData.results[0].url.match(/tt\d{7}/)[0]
          movie.save(function(){
            //get the data from imdb....
            oneIMDB(movie.imdb_id);
            console.log("saved: " + movie.imdb_id.green)
          })
        } else {
          console.log(res.body);
        }
      })

      i++
    }, 20000)
  })
}

function oneIMDB(imdb_id) {
  Movie.findOne({imdb_id: imdb_id}, function(err, movie){
    if(err) {throw err}
    if(movie){
      var url = "http://www.omdbapi.com/?i="+imdb_id+"&plot=full&r=json&tomatoes=true"

      request(url, function(err, res, body){
        if(err) throw err;
        var json_res = JSON.parse(res.body);

        movie.imdb_data = json_res;
        movie.save(function(){ console.log("imdb data saved: " + movie.imdb_data.Title)})
      })
    }
  })
}

function allIMDB() {
  //find docs with imdb_id but no data -- 
  Movie.find({ imdb_id: { $ne: null }, imdb_data: null }, function(err, movies){
    //fill in their data...

    var i = 0;
    var intId = setInterval(function () {
      if(i >= movies.length) {return;}
      console.log(movies.length);
      if(i>movies.length) {clearInterval(intId)};
      var movie = movies[i];
      var url = "http://www.omdbapi.com/?i="+movie.imdb_id+"&plot=full&r=json&tomatoes=true"

      request(url, function(err, res, body){
        if(err) throw err;
        var json_res = JSON.parse(res.body);

        movie.imdb_data = json_res;
        movie.save(function(){ console.log("imdb data saved: " + movie.imdb_data.Title)})
      })

      i++
    }, 1000)
  }) 
}
