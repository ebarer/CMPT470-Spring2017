/* Elliot Barer, ebarer [at] mac [dot] com, 2017-01-31 */


//////////////////////////////////////////////////
// REQUIREMENTS
//////////////////////////////////////////////////
var http = require('http');
var path = require('path');
var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var file = "music.db";

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(file);

//////////////////////////////////////////////////
// CREATE EXPRESS SERVER
//////////////////////////////////////////////////
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//////////////////////////////////////////////////
// PAGES
//////////////////////////////////////////////////
app.get('/playlists', function(request, response) {
    loadPage(request, response);
});

app.get('/library', function(request, response) {
    loadPage(request, response);
});

app.get('/search', function(request, response) {
    loadPage(request, response);
});

app.get('/', function(request, response) {
    response.status(301);
    response.setHeader('Location', 'http://localhost:3000/playlists');
    response.send('Redirecting to Playlists\n');
});

var loadPage = function(request, response) {
    response.status(200);
    response.setHeader('Content-Type', 'text/html');
    response.setHeader('Cache-Control', 'max-age=1800');
    
    var fPath = path.join(__dirname, 'playlist.html');
    fs.createReadStream(fPath).pipe(response);
}


//////////////////////////////////////////////////
// API
//////////////////////////////////////////////////
app.get('/api/songs', function(request, response) {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/json');
    response.setHeader('Cache-Control', 'max-age=1800');

    db.all('SELECT * FROM songs', function(err, rows) {
        response.send(JSON.stringify({'songs' : rows}, null, 4));
    });
});

app.get('/api/playlists', function(request, response) {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/json');
    response.setHeader('Cache-Control', 'max-age=1800');
    
    // Use group_concat to create an array string of songs
    // for the playlist, from the results of the merge table
    var query = "SELECT p.id, p.name, group_concat(song_id) AS songs " +
                "FROM playlists p " +
                "LEFT OUTER JOIN songs_playlists m on p.id = m.playlist_id " +
                "GROUP BY p.id, p.name";
                
    db.all(query, function(err, rows) {
        response.send(JSON.stringify({'playlists' : rows}, null, 4));
    });
});

app.post('/api/playlists', function(request, response) {
    var data = JSON.stringify(request.body, null, '\t');
    
    fs.writeFile('playlists.json', data, function(error) {
        if (error) {
            response.statusCode = 400;
            response.setHeader('Content-Type', 'text/plain');
            response.end('Error updating file.');
        }

        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/plain');
        response.end('Updated file successfully.');
    });
});


//////////////////////////////////////////////////
// JAVASCRIPT
//////////////////////////////////////////////////
app.get('/music-app.js', function(request, response) {    
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/javascript');
    response.setHeader('Cache-Control', 'max-age=1800');

    var fPath = path.join(__dirname, request.url);
    fs.createReadStream(fPath).pipe(response);
});


//////////////////////////////////////////////////
// STYLESHEETS + IMAGES
//////////////////////////////////////////////////
app.get('/playlist.css', function(request, response) {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/css');
    response.setHeader('Cache-Control', 'max-age=1800');

    var fPath = path.join(__dirname, request.url);
    fs.createReadStream(fPath).pipe(response);
});

app.use('/img', express.static(__dirname + '/img'));


//////////////////////////////////////////////////
// SERVER 404 (for all other pages)
//////////////////////////////////////////////////
app.get('*', function(request, response) {
    response.status(404).send('<html><body><h1>404 Error</h1></body></html>');
});


//////////////////////////////////////////////////
// START SERVER (port: 3000)
//////////////////////////////////////////////////
app.listen(3000, function() {
    console.log('Amazing music app server listening on port 3000!')
});
