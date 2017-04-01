'use strict';

var express = require('express');
var socket = require('socket.io');
var assert = require('assert');

//Tyler Alway
/*
NAME
NAME_RESP
HELLO
LIST_ROOMS
LIST_ROOMS_RESP
LIST_USERS
LIST_USERS_RESP
JOIN_ROOM
JOIN_ROOM_RESP
LEAVE_ROOM
LEAVE_ROOM_RESP
CREATE_ROOM
CREATE_ROOM_RESP
MESSAGE
connection
disconnect
*/

//create express server
var server = express();

server.use('/', express.static(__dirname + '/'));

var io = socket(server.listen(process.env.PORT || 8080));

//List of all clients connected to the server
var objectClients = {};

//List of all rooms active on the server
//Has a default room called global that all uers will be connected to
var rooms = {};
rooms['global'] = {'users' : {}};

//On a connection event
io.on('connection', function(socketHandle) {

  //create a session id
  var id = Math.random().toString(36).substr(2, 8);

  // While to id is not unique generate a new id
  while(objectClients[id] !== undefined) {
    id = Math.random().toString(36).substr(2, 8);
  }

  // Adds the user to the user list with thier sockethandle
	objectClients[id] = {'socketHandle': socketHandle, 'username': ' '};

  //Emit a NAME event to fetch the username from the client
  socketHandle.emit('NAME', {
      'id': id,
      'message': "Please enter a userneame",
      'error': false,
  	});


  //on a NAME_RESP event
  socketHandle.on('NAME_RESP', function(data){

    // Check to make sure the username is not taken if it is emit a NAME event
    //with the correct error message
    var exists = false;
    var error = false;
    for (var prop in objectClients) {
      if (objectClients[prop].username === data.user) {
          exists = true;
      }
    }
    // Check to see if this is a valid username
    if (data.user === '') {
      error = true;
    }

    //if the user exists
    if (exists === false && error === false) {
      // When the clients username has been generated add it to to objectClients[id]
      objectClients[data.id].username = data.user;

      // Adds the user to the global room
      rooms['global'].users[data.id] = {'socketHandle': socketHandle, 'username': data.user};
      //emits hello event
      socketHandle.emit('HELLO', {});
    }

    //else the user does not exist
    //emit a NAME event with a error and error message
    else if (error === false) {
      socketHandle.emit('NAME', {
          'id': id,
          'message': '',
          'error': true,
          'errorMessage': "Error that username has been taken plase enter another username.",
        });
    }

    //else if there was an error
    else {
      socketHandle.emit('NAME', {
          'id': id,
          'message': '',
          'error': true,
          'errorMessage': "Error invalid username.",
        });
    }
  });

  //on a LIST_ROOMS event
  socketHandle.on('LIST_ROOMS', function(){
    //Get the list of rooms
    var send = [];
    var i = 0;
    for (var prop in rooms) {
        send[i] = prop;
        i++;
    }

    //send the list of rooms to the user
    socketHandle.emit('LIST_ROOMS_RESP', {
      'rooms': send,
      'error': false
    });
  });


  //on a LIST_USERS event
  socketHandle.on('LIST_USERS', function(data){
    var send = [];
    var i = 0;

    //if there are no rooms listed this is an error
    if (data.rooms === undefined || data.rooms.length === 0) {
      //emit a LIST_USERS_RESP event sending the list of users
      socketHandle.emit('LIST_USERS_RESP', {
        'user': send,
        'error': true,
        'errorMessage': 'invalid room'
      });
    }

    //else normal
    else {
      //get the list of usernames
      for (var prop in rooms[data.rooms].users) {
          send[i] = rooms[data.rooms].users[prop].username;
          i++;
      }

      //emit a LIST_USERS_RESP event sending the list of users
      socketHandle.emit('LIST_USERS_RESP', {
        'user': send,
        'error': false
      });
    }
  });

  //on a JOIN_ROOM event
  socketHandle.on('JOIN_ROOM', function(data){
    //Join the given room and send a success messsage or
    //send an error message if the user is already in the room
    var messageS = 'You have joined' ;
    var messageE = 'Error you are already in';
    var roomsJoined = [];
    var k = 0;
    var error = false;

    for (var i = 0; i < data.rooms.length; i++) {
      //If you are not in the room, join room
      if (rooms[data.rooms[i]].users[data.id] === undefined) {
        rooms[data.rooms[i]].users[data.id] = {'socketHandle': socketHandle, 'username': data.user};
        messageS = messageS + ' ' + data.rooms[i];
        roomsJoined[k] = data.rooms[i];
        k++;
      }

      //Else send a message saying you are already in the room
      else {
        messageE =  messageE + ' ' + data.rooms[i];
        error = true;
      }
    }


    if (error === true) {
      //emit a JOIN_ROOM_RESP event
      socketHandle.emit('JOIN_ROOM_RESP', {
        'error': error,
        'rooms': roomsJoined,
        'errorMessage': messageE,
        'message': messageS,
      });
    }

    else {
      //emit a JOIN_ROOM_RESP event
      socketHandle.emit('JOIN_ROOM_RESP', {
        'error': error,
        'rooms': roomsJoined,
        'message': messageS,
      });
    }


  });

  //on a LEAVE_ROOM event
  socketHandle.on('LEAVE_ROOM', function(data){
        //leave the given room and send a success messsage or
        //send an error message if the user is not in the room
        //If you are not in the room, join room
        if (rooms[data.rooms].users[data.id] !== undefined) {
          delete rooms[data.rooms].users[data.id];
          socketHandle.emit('LEAVE_ROOM_RESP', {
            'error': false,
            'message': 'You have left ' + data.rooms,
            'rooms': data.rooms,
          });
        }

        //Else send a message saying you are already in the room
        else {
          socketHandle.emit('LEAVE_ROOM_RESP', {
            'error': true,
            'errorMessage': 'Error you are not in ' + data.rooms,
            'rooms': data.rooms,
          });
        }


  });

  //on a CREATE_ROOM event
  socketHandle.on('CREATE_ROOM', function(data){
    //create the given room and send a success messsage or
    //send an error message if the room already exists
    var messageS = data.rooms + ' has been created' ;
    var messageE = 'Error when creating room: ' + data.rooms;
    var error = false;

    //if the room name is not a valid string mark the error field
    if (data.rooms === '') {
      error = true;
    }


    for (var prop in rooms) {
      //If the room is found this is an error
      if (prop === data.rooms) {
        error = true;
      }
    }

    //if there was an error
    if (error === true) {
      //emit a JOIN_ROOM_RESP event
      socketHandle.emit('CREATE_ROOM_RESP', {
        'error': error,
        'errorMessage': messageE
      });
    }

    else {
      //add the room
      rooms[data.rooms] = {'users' : {}};

      //emit a CREATE_ROOM_RESP event
      socketHandle.emit('CREATE_ROOM_RESP', {
        'error': error,
        'rooms': data.rooms,
        'message': messageS,
      });
    }
  });

//on a MESSAGE event
	socketHandle.on('MESSAGE', function(data) {

		var id = '';
		for (var prop in objectClients) {
				if (objectClients[prop].socketHandle === socketHandle) {
					id = objectClients[prop].id;
				}
		}

    // if there is an array of rooms
    if (data.rooms instanceof Array) {
  		for (var i = 0; i < data.rooms.length; i++) {
  			for (var prop in rooms[data.rooms[i]].users) {
  					rooms[data.rooms[i]].users[prop].socketHandle.emit('MESSAGE', {
  						'user': data.user,
  						'rooms': data.rooms[i],
  						'message': data.message,
              'error': false,
              'errorMessage': '',
  					});
  			}
  		}
    }

    //else if the room exists
    else if (rooms[data.rooms] !== undefined) {
      for (var prop in rooms[data.rooms].users) {
          rooms[data.rooms].users[prop].socketHandle.emit('MESSAGE', {
            'user': data.user,
            'rooms': data.rooms,
            'message': data.message,
            'error': false,
            'errorMessage': '',
          });
      }
    }

    //else the room does not exist
    else {
      socketHandle.emit('MESSAGE', {
        'user': data.user,
        'rooms': data.rooms,
        'message': data.message,
        'error': true,
        'errorMessage': 'Error room does not exist',
      });
    }
	});

  //on a disconnect event
	socketHandle.on('disconnect', function() {
    //remove the user from the clients list
		for (var prop in objectClients) {
				if (objectClients[prop].socketHandle === socketHandle) {
          delete objectClients[prop];
				}
		}

    //remove the user from all rooms
    for (var prop in rooms) {
      for (var i in rooms[prop].users) {
        if (rooms[prop].users[i].socketHandle === socketHandle) {
          delete rooms[prop].users[i];
        }
      }
    }
	});
});
