var socketHandle = io.connect('http://localhost:8080/');
			jQuery('#div1').hide();
			jQuery('#div2').hide();
			// The random id assigned to the user by the server
			var strId = ' ';
			// The clients choosen username
			var username = ' ';

			//on a NAME event from the server
			//this is responsabe for printing the message or error for an NAME Request
			//from the server
			socketHandle.on('NAME', function(data) {
				//set the users id to the randomly generated string from server
				strId = data.id;
				//show the correct interface for login
				jQuery('#div1').hide();
				jQuery('#div2').show();

				//if there was an error output the error message
				if (data.error === true) {
					jQuery('#outputUname')
						.append(data.errorMessage + '<br/>');
						var objDiv = document.getElementById('outputUname');
						objDiv.scrollTop = objDiv.scrollHeight;
				}

				//else output the message sent by the server
				else {
					jQuery('#outputUname')
						.append(data.message + '<br/>');
						var objDiv = document.getElementById('outputUname');
						objDiv.scrollTop = objDiv.scrollHeight;
				}
			});

			//Button click event for submitting the username
			jQuery('#submitUname')
				.on('click', function() {
					//Send the username to the server
					username = jQuery('#uName').val();
					socketHandle.emit('NAME_RESP', {
						'id': strId,
						'user': jQuery('#uName').val(),
						'error': false,
					});
				});


				//enter event for create new rooms
				jQuery('#uName')
					.keypress(function(e) {

						if (e.which == 13) {
							//Send the username to the server
							username = jQuery('#uName').val();
							socketHandle.emit('NAME_RESP', {
								'id': strId,
								'user': jQuery('#uName').val(),
								'error': false,
							});
						}
					});

				//on a HELLO event from the server
				//this indicates you have been connected
			socketHandle.on('HELLO', function(data) {
				//Hide the login and show the main interface
				jQuery('#div1').show();
				jQuery('#div2').hide();

				//Request rooms form the server
				socketHandle.emit('LIST_ROOMS', {});

				jQuery('#joined').empty().append(jQuery('<option></option>')
												.val('global')
												.text('global')
												.prop('selected', true));

			});

			//Button click event for joining a rooms
			//must have selected a room to join or gets an error message
			jQuery('#joinroom')
				.on('click', function() {

					//get the list of rooms selected
					var room = jQuery('#rooms').val();

					//checkto make sure the list of rooms is not empty
					//You must have at least one room
					if (room.length === 0) {
						jQuery('#output').append('Error no room selected to join' + '<br>');
						var objDiv = document.getElementById('output');
						objDiv.scrollTop = objDiv.scrollHeight;
					}

					//if there was atleast one room brodcast a join event
					else {
						// Send the roomname to the server to join
						socketHandle.emit('JOIN_ROOM', {
							'id': strId,
							'user': username,
							'rooms': room,
						});
					}
				});

				//on a JOIN_ROOM_RESP event from the server
				//as of now you will join every valid room even if there was an error
				//with one of the rooms
				socketHandle.on('JOIN_ROOM_RESP', function(data){
					//if there was an error output error message
					if (data.error === true) {
						jQuery('#output').append(data.errorMessage + '<br>');
						var objDiv = document.getElementById('output');
						objDiv.scrollTop = objDiv.scrollHeight;
					}

					//if any rooms were avaliable output message
					if (data.rooms.length > 0) {
						jQuery('#output').append(data.message + '<br>');
						var objDiv = document.getElementById('output');
						objDiv.scrollTop = objDiv.scrollHeight;
					}

					// if there was no error add the rooms to the in list
					for (var i = 0; i < data.rooms.length; i++) {
						jQuery('#joined').append(jQuery('<option></option>')
														.val(data.rooms[i])
														.text(data.rooms[i]));
					}
				});

				//button for leaving a room
				jQuery('#leaveroom')
					.on('click', function() {

						var room = jQuery('#joined').val();

						if (room === null) {
							jQuery('#output').append('Error no room selected to leave' + '<br>');
							var objDiv = document.getElementById('output');
							objDiv.scrollTop = objDiv.scrollHeight;
						}

						else {
							// Send the roomname to the server to join
							socketHandle.emit('LEAVE_ROOM', {
								'id': strId,
								'user': username,
								'rooms': room,
							});
						}
					});

					//on a LEAVE_ROOM_RESP event from the server
					socketHandle.on('LEAVE_ROOM_RESP', function(data){
						//if there was no error delete room and output message
						if (data.error === false) {
							jQuery('#output').append(data.message + '<br>');
							var objDiv = document.getElementById('output');
							objDiv.scrollTop = objDiv.scrollHeight;
							jQuery("#joined option[value=" + data.rooms + "]").remove();
						}

						//else output error message
						else {
							jQuery('#output').append(data.errorMessage + '<br>');
							var objDiv = document.getElementById('output');
							objDiv.scrollTop = objDiv.scrollHeight;
						}
					});

			//button for listing rooms
			jQuery('#listrooms')
				.on('click', function() {
					socketHandle.emit('LIST_ROOMS', {'id': strId,});
				});

			//on a LIST_ROOM_RESP event from the server
			socketHandle.on('LIST_ROOMS_RESP', function(data) {
				jQuery('#rooms').empty();
				for(i = 0; i < data.rooms.length; i++) {
					jQuery('#rooms').append(jQuery('<option></option>')
								.val(data.rooms[i])
								.text(data.rooms[i])
							)
				}
			});

			//button for listing users
			jQuery('#listusers')
				.on('click', function() {

					var temp = jQuery('#joined').val();

					// if no room was selected to list users print error message and
					// clear the users box
					if (temp === null) {
						jQuery('#output').append('Error no room selected to list users' + '<br>');
						var objDiv = document.getElementById('output');
						objDiv.scrollTop = objDiv.scrollHeight;
						jQuery('#userList').empty();
					}

					// else emit a list users event
					else {
						socketHandle.emit('LIST_USERS', {
							'id': strId,
							'rooms': temp
						});
					}
				});

				//on a LIST_USERS_RESP event from the server
			socketHandle.on('LIST_USERS_RESP', function(data) {

				//if there was an error
				if(data.error === true) {
					//output error message
					jQuery('#output').append(data.errorMessage + '<br>');
					var objDiv = document.getElementById('output');
					objDiv.scrollTop = objDiv.scrollHeight;
				}

				//else no error
				else {
					jQuery('#userList').empty();
					for(i = 0; i < data.user.length; i++) {
						jQuery('#userList').append(jQuery('<option></option>')
									.val(data.user[i])
									.text(data.user[i])
								)
					}
				}
			});

			//Button click event for create new rooms
			jQuery('#submitroom')
				.on('click', function() {

					var room = jQuery('#roomname').val();
					//emit a create rooms event
					socketHandle.emit('CREATE_ROOM', {
						'id': strId,
						'rooms': room,
						'error': false,
					});

					socketHandle.emit('LIST_ROOMS', {'id': strId,});

					jQuery('#roomname').val('');

				});

				//enter event for create new rooms
				jQuery('#roomname')
					.keypress(function(e) {

						if (e.which == 13) {
							var room = jQuery('#roomname').val();
							//emit a create rooms event
							socketHandle.emit('CREATE_ROOM', {
								'id': strId,
								'rooms': room,
								'error': false,
							});
							socketHandle.emit('LIST_ROOMS', {'id': strId,});
							jQuery('#roomname').val('');
						}
					});







				//on a NAME event from the server
				socketHandle.on('CREATE_ROOM_RESP', function(data){

					//if there was an error output the message
					if (data.error === true) {
						jQuery('#output').append(data.errorMessage + '<br>');
						var objDiv = document.getElementById('output');
						objDiv.scrollTop = objDiv.scrollHeight;
					}

					// if there was no error add the rooms to the in list
					else {
						jQuery('#output').append(data.message + '<br>');
						var objDiv = document.getElementById('output');
						objDiv.scrollTop = objDiv.scrollHeight;
					}
				});

				//on a MESSAGE event from the server
			socketHandle.on('MESSAGE', function(data) {
				// if there was no error cont.
				if (data.error === false) {
					jQuery('#output')
						.append(data.user + ' in ' + data.rooms + ': ' + data.message + '<br/>');
						var objDiv = document.getElementById('output');
						objDiv.scrollTop = objDiv.scrollHeight;
				}

				//else error message
				else {
					jQuery('#output')
						.append(data.errorMessage + '<br/>');
						var objDiv = document.getElementById('output');
						objDiv.scrollTop = objDiv.scrollHeight;
				}
			});

			//button for submitting messages
			jQuery('#submit')
				.on('click', function() {
					socketHandle.emit('MESSAGE', {
						'user': username,
						'id': strId,
						'rooms': jQuery('#joined').val(),
						'message': jQuery('#message').val()
					});

					jQuery('#message').val('');
				});


				//enter event for create new rooms
				jQuery('#message')
					.keypress(function(e) {

						if (e.which == 13) {
							socketHandle.emit('MESSAGE', {
								'user': username,
								'id': strId,
								'rooms': jQuery('#joined').val(),
								'message': jQuery('#message').val()
							});

							jQuery('#message').val('');
						}
					});

				//on a disconnect event from the server
				socketHandle.on('disconnect', function() {
					jQuery('#outputUname')
						.empty()
						.append('connection to server was lost please try again later' + '<br/>');
						var objDiv = document.getElementById('output');
						objDiv.scrollTop = objDiv.scrollHeight;
						jQuery('#div1').hide();
						jQuery('#div2').show();
				});
