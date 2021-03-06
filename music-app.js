/* Elliot Barer, ebarer [at] mac [dot] com, 2017-01-16 */

//////////////////////////////////////////////////
// Global Variables
//////////////////////////////////////////////////
var socket = io('/');       // Real-Time WebSocket

var songsLoaded = false;
var playlistsLoaded = false;
var songs = [];
var playlists = [];

var startPage = 'playlists';
var currentUser;
var currentPage;
var currentPlaylist;
var currentSong;
var sortBy = 'artist';


//////////////////////////////////////////////////
// Global and View-Specific Listeners
//////////////////////////////////////////////////
document.getElementById('tab-library').addEventListener('click', function(event){
    event.preventDefault();
    window.history.pushState('library', event.target.textContent, '/library');
    loadPage('library');
});
document.getElementById('tab-playlists').addEventListener('click', function(event){
    event.preventDefault();
    window.history.pushState('playlists', event.target.textContent, '/playlists');
    loadPage('playlists');
});
document.getElementById('tab-search').addEventListener('click', function(event){
    event.preventDefault();
    window.history.pushState('search', event.target.textContent, '/search');
    loadPage('search');
});

document.getElementById('sort-artist').addEventListener('click', function(){
    setSortBy('artist');
    loadLibraryTab();    
});
document.getElementById('sort-title').addEventListener('click', function(){
    setSortBy('title');
    loadLibraryTab();
});

document.getElementById('add-playlist').addEventListener('click', function(){
    loadNewPlaylistForm();
});
document.getElementById('add-user').addEventListener('click', function(){
    loadAddUserForm();
});
    
document.getElementById('search').addEventListener('input', searchMusic, false);
document.querySelectorAll('#search form')[0].addEventListener('submit', function(event){
    event.preventDefault();
});


//////////////////////////////////////////////////
// POST and GET functions
//////////////////////////////////////////////////
var getRequest = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.send(null);
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            if (callback && typeof(callback) === "function") {
                callback(JSON.parse(xhr.responseText));
            }
        }
    }
}

var postRequest = function(url, data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");    
    xhr.send(data);
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            if (callback && typeof(callback) === "function") {
                callback(xhr.status, JSON.parse(xhr.responseText));
            }
        }
    }
}

var deleteRequest = function(url, data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("DELETE", url, true);
    xhr.setRequestHeader("Content-type", "application/json");    
    xhr.send(data);
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            if (callback && typeof(callback) === "function") {
                callback(xhr.status, JSON.parse(xhr.responseText));
            }
        }
    }
}


//////////////////////////////////////////////////
// Load data from JSON
// Base app methods
//////////////////////////////////////////////////
// Load data with API calls on page load
window.addEventListener('DOMContentLoaded', function(){
    var path = window.location.pathname;
    if (path !== '') {
        startPage = path.substr(1);
    }
    
    getRequest('api/playlists', loadPlaylists);
    getRequest('api/songs', loadSongs);
    getRequest('api/users/current', getCurrentUser);
});

// Handle history states
window.addEventListener('popstate', function(event) {
    loadPage(event.state);
});

var loadPlaylists = function(responseText) {    
    playlists = responseText.playlists;
    playlistsLoaded = true;
    attemptRunApplication();
}

var loadSongs = function(responseText) {    
    songs = responseText.songs;
    songsLoaded = true;
    attemptRunApplication();
}

var getCurrentUser = function(responseText) {
    currentUser = responseText.user;
}

var attemptRunApplication = function() {
    if (songsLoaded == true && playlistsLoaded == true && currentUser !== undefined) {
        document.getElementById('applicationLoader').classList.remove('active');
        loadPage(startPage);
    }
};

var loadPage = function(page, callback) {
    var animators = document.querySelectorAll('.navigation-animator');
    for (var i = 0; i < animators.length; i++) {
        animators[i].style.left = '0';
    }

    if (currentPage !== page) {
        currentPage = page;
        reset();

        document.title = 'Exercise 3 - ' + currentPage;

        switch(currentPage) {
            case 'library':
                loadLibraryTab();
                break;
            case 'playlists':
                loadPlaylistsTab();
                break;
            case 'search':
                loadSearchTab();
                break;
            default: break;
        }
    }

    // Execute callback (if provided)
    if(callback && typeof callback == "function") {
        callback();
    }
}

var reset = function() {
    var nav = document.querySelectorAll('nav li');
    nav.forEach(function(element) {
        element.classList.remove('active');
    });

    var views = document.querySelectorAll('.view');
    views.forEach(function(view) {
       view.classList.remove('active');
    });
}


//////////////////////////////////////////////////
// Views
//////////////////////////////////////////////////
var loadLibraryTab = function() {
    document.getElementById('tab-library').classList.add('active');
    document.getElementById('library').classList.add('active');

    if (sortBy === 'title') {
        sortByTitle();
    } else {
        sortByArtist();
    }

    var list = document.querySelectorAll('#library ul')[0];
    list.innerHTML = '';
    for (var i = 0; i < songs.length; i++) {
        createSong(songs[i], list);
    }
};

var loadPlaylistsTab = function() {
    document.getElementById('tab-playlists').classList.add('active');
    document.getElementById('playlists').classList.add('active');

    var list = document.querySelectorAll('#playlists ul')[0];
    list.innerHTML = '';
    for (var i = 0; i < playlists.length; i++) {
        createPlaylist(playlists[i], list);
    }
};

var loadSearchTab = function() {
    document.getElementById('tab-search').classList.add('active');
    document.getElementById('search').classList.add('active');
};


//////////////////////////////////////////////////
// Overlay forms
//////////////////////////////////////////////////
var displayForm = function(form) {
    document.getElementsByTagName('body')[0].classList.add('preventScroll');
    document.getElementsByClassName('overlay')[0].classList.add('active');
    
    var forms = document.querySelectorAll('.overlay-form');
    for (var i = 0, item; item = forms[i]; i++) {
        item.classList.remove('active');
    }
    document.getElementById(form).classList.add('active');
    
    var closeButton = document.getElementById(form).querySelector('.form-close');
    closeButton.addEventListener('click', hideForm);
}

var hideForm = function() {
    document.getElementsByTagName('body')[0].classList.remove('preventScroll');
    document.getElementsByClassName('overlay')[0].classList.remove('active');

    var activeOverlay = document.getElementsByClassName('overlay-form active')[0];

    var closeButton = activeOverlay.getElementsByClassName('form-close')[0];
    closeButton.removeEventListener('click', hideForm);
    
    var form = activeOverlay.querySelector('form');
    if (form !== null) {
        form.removeEventListener('submit', createNewPlaylist);
    }

    activeOverlay.classList.remove('active');
}

var loadNewPlaylistForm = function() {
    var form = document.querySelectorAll('#new-playlist-form form')[0];
    var nameInput = form.querySelector('input[name="playlist-name"]');
    nameInput.value = "";
    form.addEventListener('submit', createNewPlaylist);
    
    displayForm('new-playlist-form');
    nameInput.focus();
}

var createNewPlaylist = function(event){
    event.preventDefault();

    var form = document.querySelectorAll('#new-playlist-form form')[0];
    var newPlaylistName = form.querySelector('input[name="playlist-name"]').value;
    
    var data = JSON.stringify({'name' : newPlaylistName}, null, 4);
    postRequest('/api/playlists', data, function(status, response){
        if (status == 200) {
            var newPlaylist = {id: response.id, name: response.name, songs: [] }
            playlists.push(newPlaylist);
            
            var list = document.querySelectorAll('#playlists ul')[0];
            createPlaylist(newPlaylist, list);
        }
    
        hideForm();
    });
}
    
var loadAddSongForm = function() {
    var list = document.querySelectorAll('#add-song-form ul')[0];
    list.innerHTML = '';
    
    getRequest('/api/songs/'+currentSong.id, function(response) {
        var songPlaylists = response.song.playlists;

        for (var i = 0; i < playlists.length; i++) {
            if (!songPlaylists.includes(playlists[i].id)) {
                var listItem = document.createElement('li');
                var listItemTitle = document.createElement('a');
                listItemTitle.innerHTML = playlists[i].name;
                listItem.appendChild(listItemTitle);
                list.appendChild(listItem);
        
                listItem.addEventListener('click', addToPlaylist(playlists[i]));
            }
        }
    });
    
    displayForm('add-song-form');
}

// TODO: Merge duplicate code?
var addToPlaylist = function(selectedPlaylist) {
    return function() {
        selectedPlaylist.songs.push(currentSong.id);

        var data = {
            'song' : currentSong.id,
            'playlist' : selectedPlaylist.id
        };
        
        //postRequest('/api/playlists/'+selectedPlaylist.id, data);
        socket.emit('addToPlaylist', JSON.stringify(data, null, '\t'));
        
        if (currentPage == "playlists" && currentPlaylist === selectedPlaylist) {
            loadPlaylist(selectedPlaylist);
        }
        
        hideForm();
    }
}

socket.on('addSongToPlaylist', function(response) {
    var data = JSON.parse(response);
    var playlist_id = data.playlist;
    var song_id = data.song;
    
    var playlist = playlists.filter(function(p){
        if (p.id === playlist_id) return p;
    })[0];
    
    playlist.songs.push(song_id);
    
    if (currentPage == "playlists" && currentPlaylist === playlist) {
        loadPlaylist(playlist);
    }
});

// TODO: Merge duplicate code?
var removeFromPlaylist = function(selectedPlaylist) {
    var index = selectedPlaylist.songs.indexOf(currentSong.id);
    selectedPlaylist.songs.splice(index, 1);
    
    var data = {
        'song' : currentSong.id,
        'playlist' : selectedPlaylist.id
    };
    
    //deleteRequest('/api/playlists/'+selectedPlaylist.id, data);
    socket.emit('removeFromPlaylist', JSON.stringify(data, null, '\t'));

    if (currentPage == "playlists" && currentPlaylist === selectedPlaylist) {
        loadPlaylist(selectedPlaylist);
    }
}

socket.on('removeSongFromPlaylist', function(response) {
    var data = JSON.parse(response);
    var playlist_id = data.playlist;
    var song_id = data.song;
    
    var playlist = playlists.filter(function(p){
        if (p.id === playlist_id) return p;
    })[0];
    
    var index = playlist.songs.indexOf(song_id);
    playlist.songs.splice(index, 1);
    
    if (currentPage == "playlists" && currentPlaylist === playlist) {
        loadPlaylist(playlist);
    }
});

var loadAddUserForm = function() {
    var list = document.querySelectorAll('#add-user-form ul')[0];
    list.innerHTML = '';

    getRequest('/api/users/', function(response) {
        var users = response.users;
        
        users.forEach(function(user) {
            if (user.id !== currentUser) {
                var listItem = document.createElement('li');
                var listItemTitle = document.createElement('a');
                listItemTitle.innerHTML = user.username;
                listItem.appendChild(listItemTitle);
                list.appendChild(listItem);
    
                listItem.addEventListener('click', addUser(user)); 
            }
        });
    });
    
    displayForm('add-user-form');
}

var addUser = function(selectedUser) {
    return function() {
        var data = JSON.stringify({'user' : selectedUser.id}, null, '\t');
        postRequest('/api/playlists/'+currentPlaylist.id+'/users/', data);        
        hideForm();
    }
}


//////////////////////////////////////////////////
// Navigation Controller
//////////////////////////////////////////////////
var navigateToPlaylist = function(playlist) {
    return function() {
        currentPlaylist = playlist;

        loadPlaylist(playlist);

        document.getElementById('playlist-name').innerHTML = playlist.name;

        loadPage('playlists');

        // Scroll playlist view to the top, then animate in
        document.getElementById('playlist-view').scrollTop = 0;
        var animator = document.querySelectorAll('#playlists .navigation-animator')[0];
        animator.style.left = '-100%';
    }
}

var loadPlaylist = function(playlist) {    
    var list = document.querySelectorAll('#playlists ul.playlist-song-list')[0];
    list.innerHTML = '';

    for (var i = 0; i < playlist.songs.length; i++) {
        var song = songs.filter(function(s){
            return playlist.songs[i] === s.id;
        });
        createSong(song[0], list);
    }
}

//////////////////////////////////////////////////
// Sorting
//////////////////////////////////////////////////
function setSortBy(sort) {
    sortBy = sort;
}

function sortByArtist() {    
    document.getElementById('sort-title').classList.remove('active');
    document.getElementById('sort-artist').classList.add('active');

    songs.sort(function(a, b) {
        return comparator(a.artist, b.artist)
    });
};

function sortByTitle() {    
    document.getElementById('sort-title').classList.add('active');
    document.getElementById('sort-artist').classList.remove('active');

    songs.sort(function(a, b) {
        return comparator(a.title, b.title)
    });
};

// Credit:  http://stackoverflow.com/questions/34347008/
// Concept, Regular Expression, and "Replacer" taken from the aforementioned URL
function comparator(a, b) {
    var articles = ['a', 'an', 'the'],
        re = new RegExp('^(?:(' + articles.join('|') + ') )(.*)$'), // e.g. /^(?:(foo|bar) )(.*)$/
        replacer = function ($0, $1, $2) {
            return $2 + ', ' + $1;
        };

    a = a.toLowerCase().replace(re, replacer);
    b = b.toLowerCase().replace(re, replacer);

    return a === b ? 0 : a < b ? -1 : 1;
}


//////////////////////////////////////////////////
// Search
//////////////////////////////////////////////////
function searchMusic() {    
    var input = document.querySelector('input[name="search"]');
    var searchString = input.value.toLowerCase();

    var list = document.querySelectorAll('#search ul')[0];
    list.innerHTML = '';

    // Avoid populating for empty string search
    if (searchString) {
        var matchedPlaylists = playlists.filter(function(playlist){
            return playlist.name.toLowerCase().includes(searchString);
        });

        var matchedSongs = songs.filter(function(song){
            return (song.title.toLowerCase().includes(searchString)) || (song.artist.toLowerCase().includes(searchString));
        });

        for (var i = 0; i < matchedPlaylists.length; i++) {
            createPlaylist(matchedPlaylists[i], list);
        }

        for (var i = 0; i < matchedSongs.length; i++) {
            createSong(matchedSongs[i], list);
        }
    }
}


//////////////////////////////////////////////////
// Generate list items
//////////////////////////////////////////////////
var createPlaylist = function(playlist, list) {
    var newPlaylistLi = document.createElement('li');
    newPlaylistLi.classList.add('row', 'playlist');

    var rowContainer = document.createElement('div');
    rowContainer.classList.add('row-container');
    newPlaylistLi.appendChild(rowContainer);

    var artworkItem = document.createElement('div');
    artworkItem.classList.add('row-artwork');

    var listTitle = document.createElement('h4');
    listTitle.classList.add('row-title');
    listTitle.innerHTML = playlist.name;

    var symbolChevron = document.createElement('span');
    symbolChevron.classList.add('glyphicon', 'glyphicon-chevron-right');

    rowContainer.appendChild(artworkItem);
    rowContainer.appendChild(symbolChevron);
    rowContainer.appendChild(listTitle);

    newPlaylistLi.addEventListener('click', navigateToPlaylist(playlist));

    list.appendChild(newPlaylistLi);
};

var createSong = function(song, list) {
    var newSongLi = document.createElement('li');
    newSongLi.classList.add('row', 'song');

    var rowContainer = document.createElement('div');
    rowContainer.classList.add('row-container');
    newSongLi.appendChild(rowContainer);

    // SONG INFORMATION
    var artworkItem = document.createElement('div');
    artworkItem.classList.add('row-artwork');

    var listTitle = document.createElement('h4');
    listTitle.classList.add('row-title');
    listTitle.innerHTML = song.title;

    var listSubtitle = document.createElement('p');
    listSubtitle.classList.add('row-subtitle');
    listSubtitle.innerHTML = song.artist;

    // CONTROLS
    var symbolPlay = document.createElement('span');
    symbolPlay.classList.add('glyphicon', 'glyphicon-play');

    var symbolAdd = document.createElement('span');
    symbolAdd.classList.add('glyphicon', 'glyphicon-plus-sign');
    symbolAdd.addEventListener('click', function(){
        currentSong = song;
        loadAddSongForm();
    }, false);
    
    var symbolDelete = document.createElement('span');
    symbolDelete.classList.add('glyphicon', 'glyphicon-remove');
    symbolDelete.addEventListener('click', function(){
        currentSong = song;
        removeFromPlaylist(currentPlaylist);
    }, false);

    // CONFIGURE LIST ITEM
    rowContainer.appendChild(artworkItem);
    
    if (list.classList.contains('playlist-song-list')) {
        rowContainer.appendChild(symbolDelete);
    }
    
    rowContainer.appendChild(symbolAdd);
    rowContainer.appendChild(symbolPlay);
    rowContainer.appendChild(listTitle);
    rowContainer.appendChild(listSubtitle);

    list.appendChild(newSongLi);
}

