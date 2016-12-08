Object.size = function(obj) {
  var size = 0, key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};
//var ip = process.env.OPENSHIFT_NODEJS_IP;

var http = require("http");
var fs = require("fs");
var path = require("path");

var server_ip_address  = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var port2      = 8081;

var checkMimeType = true;


var server = http.createServer(function(request, response) {

  console.log("hello world server first line");
  if(request.method == "GET" ){
          var filename = request.url || "index.html";
          var ext = path.extname(filename);
          var localPath = __dirname;
          var validExtentions = {
            ".html":"text/html",
            ".css": "text/css",
            ".js" : "text/javascript",
            ".gif": "image/gif"
          }

          var validMimeType = true;
          var mimeType = validExtentions[ext];
          if(checkMimeType){
            validMimeType = validExtentions[ext] != undefined;
          }
          if(validMimeType){
            localPath = localPath + path.sep + "webapp" + filename;/*+ path.sep +"Browser"*/
            fs.exists(localPath,function(exists){
              if(exists){
                console.log("serving file: "+localPath);
                getFile(localPath,response,mimeType);
              }else{
                console.log("File not found: "+ localPath);
                response.writeHead(404);
                response.end();
              }
            });
          }else {
            console.log("Invalid file extension: " + ext + "(" + filename + ")");
          }
  }else if(request.method == "POST")
  {
    var url = request.url;
    if(url == "/auth")
    {
      console.log("hello world after scanning");
      var body = '';
      request.on('data', function(chunk)
      {
        body += chunk.toString();
      });

      request.on('end', function () {
        var params = JSON.parse(body);
        console.log("Recived Params: "+JSON.stringify(params));
        var uuId = params.uuid;
        var accessToken = params.access_token;

        var msg = {'op':'authdone','accessToken':accessToken};
        if(clients[uuId] != undefined || clients[uuId] != null)
        {
          console.log("Before "+Object.size(clients));
          clients[uuId].send(JSON.stringify(msg),{mask:false});
          delete clients[uuId];
          console.log("After "+Object.size(clients));

          response.end('{"status":"OK"}');

        }
        else
        {
          response.end('{"status":"NOK"}');
        }

      });
    }
    else
    {
      response.end('{"status":"NOK"}');

    }
  }
  else
  {

    response.writeHead(200, {"Content-Type": "text/text","Access-Control-Allow-Origin":"*"});
    response.end("NOT Supported ramakant");
  }

  process.on('uncaughtException', function(err) {
    response.end("Exception");
  });

}).listen(server_port,server_ip_address);

/**
* getFile function implementation
*/
function getFile(localPath,response,mimeType){
  fs.readFile(localPath,function(err,contents){
    if(!err){
      console.log("read file no error 1");
      response.setHeader("Content-Length",contents.length);
      if(mimeType != undefined){
        console.log("read file no error 2");
        response.setHeader("Content-Type",mimeType);
      }
      console.log("read file no error 3");
      response.statusCode = 200;
      response.write(contents);
      response.end();
    }else {
      console.log("read file no error 4");
      response.writeHead(500);
      response.end();
    }
  });
}


/**
* socket Programming start block
*/

var WebSocketServer = require('ws').Server
var uuid = require('node-uuid');
var wss = new WebSocketServer({ path:'/qrcode',server:server,autoAcceptConnections: false});


var clients = {};
var dumCounter=0;
wss.on('connection', function connection(ws) {

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    var obj = JSON.parse(message);
    if(obj.op == 'hello')
    {
      var uuidToken = uuid.v1();
      clients[uuidToken] = ws;
      var hello = { op:'hello',token:uuidToken};
      ws.send(JSON.stringify(hello),{mask:false});
    }

  });

});

/**
* socket programming end block
*/
