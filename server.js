var express = require('express');
var app = express();
var $ = require('jquery');
/*var $;
require("jsdom").env("", function(err, window) {
    if (err) {
        console.error(err);
        return;
    }
 
    $ = require("jquery")(window);
});*/
var port = 3445;

app.listen(port, function () {
  console.log(`Server listening on port ${port}...${new Date().toString("hh:mm tt")}`);
});

app.use(express.static(__dirname));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use("/api", function(req, res){
    console.log("request sent to node server");
    $.getJSON(`https://itunes.apple.com/search?term=${req.query.artist}&country=us`, function(data){
        console.log("here is the data from api");
        console.log(data);
        res.writeHead(200, {"Content-Type": "application/json"});
        // res.write(data);
        res.end(data);
    })/*.error(function(jqXHR, textStatus, errorThrown) {
        console.log("error " + textStatus);
        console.log("incoming Text " + jqXHR.responseText);
    })*/;
});