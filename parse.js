var fs = require('fs');
var ptn = require('parse-torrent-name');
var imdb = require('imdb-api');
var request = require('request');
var colors = require('colors');

var res = [];
fs.readdir('../.', function(err, files){
  if(err) throw err;

  var torrents = files.filter(function(f){ return f.match(/.*\.torrent$/) })

  //set starting point...
  var i=0

  //set interval
  var intId = setInterval(function () {
    if(i>5) {clearInterval(intId)}

    var r = ptn(tn)
    r.file_name = tn
    r.title = r.title.replace('torrent', '')
    "I'm {age} years old!".supplant({ age: 29 })
    //good data
    if(r.title && r.year){
      var url = 'http://ajax.googleapis.com/ajax/services/search/web?v=1.0&q='
      url += r.title.replace(/\s/g,'+') + "+"
      url += r.year + "+"
      url += "site:imdb.com"
      console.log(url.grey);
      request(url, function (err, res, body) {
        if (err) { throw err; }
        var json_res = JSON.parse(res.body)

        if (json_res.responseData) {
          r.imdb_id = json_res.responseData.results[0].url.match(/tt\d\d\d\d\d\d/)[0].green
          console.log((r.imdb_id + "    " + tn + "\n").green);
          i++
        } else {
          console.log('google blocked us\n'.red);
          console.log(json_res.red);
        }
      })
    } else {i++}
  }, 5000)
})











//write to json file
// var json = JSON.stringify(res);
//
// fs.unlink('parsed.json', function(err){
//   if(err) throw(err);
//
//   fs.writeFile('parsed.json', json, function(err){
//     if(err) {console.log(err)}
//
//     console.log("the file was written");
//   })
// })
