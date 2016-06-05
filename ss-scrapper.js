var http = require('http')
    ,argv = require('optimist').argv
    ,validator = require('validator');

module.exports.getEventId = getEventId;

function getEventId(url_str, cb){
  var promise = new Promise(function (resolve, reject) {
    cb = cb || ((err, id) => { if (err) {throw err;}});
    var resp_cb = (resp) => {
      var html = "";
      resp.on('data', (chunk) => { html+=chunk; });
      resp.on('end', () => {
        try {
          var id = html.match(/appKernel\.bootstrap\('Details\.Controller', \[(\d{7})\]\)/)[1];
        } finally {
          if(id === undefined) { return cb(new Error('id not found')) };
        }
        resolve(id);
        return cb(null, id);
      });
      resp.on('error', (err) => {
        reject(err);
        cb(err);
      });
    }
    http.request(url_str, resp_cb).end();
  })

  return promise;
}

if(!module.parent){
    getEventId(argv.url, (err, id) => {
      if(err){ console.log(err); return 1;}
      console.log('id:', id);
      return 0;
    });
}
