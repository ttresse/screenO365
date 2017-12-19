var http = require('http');
var url = require('url');

//id application node-tutorial
//10c1dfa6-b7c1-4b36-9fbf-a8699fa4c5c1

//mdp application
//chxNGK643|hpmiIFLR90]_!



function start(route, handle) {
  function onRequest(request, response) {
    var pathName = url.parse(request.url).pathname;
    // console.log('Request for ' + pathName + ' received.');
    route(handle, pathName, response, request);
  }

  var port = 8000;
  http.createServer(onRequest).listen(port);
  // console.log('Server has started. Listening on port: ' + port + '...');
}

exports.start = start;