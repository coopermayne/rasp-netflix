var async = require('async');

async.waterfall([
  function(callback){
    callback(null, 'a', 'b')
  },
  function(arg1, arg2, callback){
    setTimeout(function(){
      callback(null, 12)
    }, 5000)
  },
  function(arg1, callback){
    callback(null, arg1)
  },
], function(err, res){
  console.log(res);
})
