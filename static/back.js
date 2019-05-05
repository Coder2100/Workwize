
// jQuery document ready to listen to event
$(document).ready(function() {
    var socket=io.connect(location.protocol+'//'+document.domain+':'+location.port);
    privateWindow=false;
    inRoom=false;
    // initial connecting the user,
    socket.on('connect',()=>{
        $('#messageInput').on("keyup",function(key) {
        //document.querySelector('#messageInput').onkeyup = () =>{
            activeChannel=$("#channelList .active").attr('id');
            //broadcast to general channels being the default if none specific one created
            if (key.keyCode==13 && $(this).val()!="" && !privateWindow && !inRoom) {// only if u not in the private chat and other specific channel
                const mymessage=$(this).val();
                const username=localStorage.getItem('username');
                const time=new Date().toLocaleString();
                document.querySelector('#messageInput').value = "";
                socket.emit('submit to all',{'mymessage':mymessage,'username':username,'time':time});
            }//direct message
            if (key.keyCode==13 && $(this).val()!="" && !privateWindow && inRoom) {
                const mymessage=$(this).val();
                const username=localStorage.getItem('username');
                const time=new Date().toLocaleString();
                document.querySelector('#messageInput').value = "";
                socket.emit('submit to room',{'channel':activeChannel,'mymessage':mymessage,'username':username,'time':time});
            //send private
            } else if (key.keyCode==13 && $(this).val()!="" && privateWindow && !inRoom) {
                const mymessage=$(this).val();
                const username=localStorage.getItem('username');
                const username2=localStorage.getItem('activeMessage');
                const time=new Date().toLocaleString();
                document.querySelector('#messageInput').value = "";
                socket.emit('private',{'mymessage':mymessage,'username':username,'time':time,'username2':username2});
            }
        });

        $('#channelList').on('click','li', function(){
            document.querySelector('#messageInput').focus();
            if (!localStorage.getItem('activeChannel')) {
                activeChannel="General";
            } else {
                activeChannel=localStorage.getItem('activeChannel');
            }
            const username=localStorage.getItem('username');
            const time=new Date().toLocaleString();
            $(this).addClass('active');

            $(this).siblings().removeClass('active');
            $('#messages').html("");
            if (activeChannel!="General" && !privateWindow) {
                socket.emit('leave',{'channel':activeChannel,'mymessage':' away','username':username,'time':time});
            }
            activeChannel=$("#channelList .active").attr('id');
            localStorage.setItem('activeChannel',activeChannel)
            if (activeChannel=='General') {
                inRoom=false;
                privateWindow=false;
                return socket.emit('come back to general');
            } else {
                inRoom=true;
                privateWindow=false;
            }
            socket.emit('join',{'channel':activeChannel,'mymessage':'online','username':username,'time':time});
         });
         //user login/ chat initiation
        if (!localStorage.getItem('username')) {
            $("#myModal").modal({backdrop: 'static', keyboard: false});//background color of modal backdrop using bootstrap jquery
            //document.querySelector('#myModal').modal({backdrop: 'static'}).disabled = false;
            document.querySelector('.modal-title').innerHTML = "Welcome to Flack Enterprise! ";
            document.querySelector('#modalInput').value = "";
        }
    });

    socket.on('announce to all', data=> {
        if (!privateWindow){
            loadMessages(data);
        }

        $('.text-danger').on('click',function() {
            chooseUser($(this).text());
        });
    });

    socket.on('joined', data=> {
        loadMessages(data);
        $('#messageInput').focus();
        $('.text-danger').on('click',function() {
            chooseUser($(this).text());
        });
    });

    socket.on('left', data=> {
        loadMessages(data);
    });

    socket.on('announce to room', data=> {
        loadMessages(data);
        $('.text-danger').on('click',function() {
            chooseUser($(this).text());
        });
    });

    socket.on('load channels', data=> {
        $('#channelList li').remove();
        loadChannels(data);
        $('#'+localStorage.getItem('activeChannel')).click();
    });

    socket.on('add username', data=> {
        if (data["error"]!="") {
            window.setTimeout(function () {
               // $("#myModal").modal({backdrop: 'static', keyboard: false});
                document.querySelector('#myModal').modal({backdrop: 'static'}).disabled = false;
                document.querySelector('.modal-title').innerHTML = data["error"];
                document.querySelector('#modalInput').value = '';
                document.querySelector('#modalButton').disabled = true;
            }, 900);
        } else {
            localStorage.setItem('username',data["username"]);
            $('#username').text(localStorage.getItem('username'));
            document.querySelector('#username')
            $('#General').click();
            $('#messageInput').focus();
        }
    });
         // Error check on Adding a channel by any user
    socket.on('add channel', data=> {
        if (data["error"]!="") {
            window.setTimeout(function () {
              //  document.querySelector('#myModal').modal({backdrop: 'static'}).disabled = false;
                $("#myModal").modal({backdrop: 'static', keyboard: false});
                document.querySelector('.modal-title').innerHTML = data["error"];
                document.querySelector('#modalInput').value = "";
                document.querySelector('#modalButton').disabled=true;

            }, 900);
        } else {
            appendChannel(data['channel']);
            $('#channelList li:last').addClass('active');
            $('#channelList li:last').click();
            inRoom=true;
            var removeHash=$('#channelList li:last').text().slice(1);
            localStorage.setItem('activeChannel',removeHash);
            $('#channelList').scrollTop(500000);
            $('#messageInput').focus();
            socket.emit('update users channels',{'channel':data['channel']});
        }
    });

    socket.on('update channels',data => {
        if ($('#'+data['channel']).length==0){
            appendChannel(data['channel']);
        }
    });

    socket.on('private room',data => {
        const li=document.createElement('li');
        li.className='list-group-item p-1';
        if (data["sender"] == localStorage.getItem('username')) {
            privateWindow=true;
            inRoom=false;
            $('#channelList .active').removeClass('active');
            localStorage.setItem('activeMessage',data['receiver']);
            loadPrivateMessages(data,data['receiver']);
            var receiverExist=false;
            $("#inbox > li").each(function() {
                if ($(this).text().search(data['receiver']) > -1) {
                    receiverExist=true;
                }
            });
            if (!receiverExist){
                li.innerHTML=data['receiver'];
                document.querySelector('#inbox').append(li);
            }
        } else {
            //if private window open
            if (privateWindow) {
                if (localStorage.getItem('activeMessage')==data['sender']) {
                    loadPrivateMessages(data,data['sender']);
                } else {
                    var senderExist=false;
                    $("#inbox > li").each(function() {
                    if ($(this).text().search(data['sender']) > -1) {
                        $(this).html(data['sender']);
                        $(this).addClass('bg-info');
                        senderExist=true;
                    }
                    });
                    if (!senderExist){
                        li.innerHTML=data['sender'];
                        li.className='list-group-item p-1 bg-info';
                        document.querySelector('#inbox').append(li);
                    }
                }
            } else {
                var senderExist=false;
                $("#inbox > li").each(function() {
                    if ($(this).text().search(data['sender']) > -1) {
                        $(this).html(data['sender']);
                        $(this).addClass('bg-info');
                        senderExist=true;
                    }
                });
                if (!senderExist){
                    li.innerHTML=data['sender'];
                    li.className='list-group-item p-1 bg-info';
                    document.querySelector('#inbox').append(li);
                }
            }
        }
        $('#inbox li').on('click', function(){
            document.querySelector('#messageInput').focus();
            localStorage.setItem('activeMessage',$(this).text());
            $(this).removeClass('bg-info');
            loadPrivateMessages(data,$(this).text());
            privateWindow=true;
            const username=localStorage.getItem('username');
            const time=new Date().toLocaleString();
            activeChannel=localStorage.getItem('activeChannel');
            if (activeChannel!="General" && inRoom ) {
                socket.emit('leave',{'channel':activeChannel,'mymessage':'away','username':username,'time':time});
            }
            inRoom=false;
            $('#channelList .active').removeClass('active');
        });
    });

    $("#modalInput").on('keyup', function (key) {
        if ($(this).val().length > 0 ){
            $("#modalButton").attr('disabled',false);
            if (key.keyCode==13 ) {
                $('#modalButton').click();
            }
        }
        else {
            $("#modalButton").attr('disabled',true);
        }
    });

    document.querySelector('#modalButton').onclick =()=>{
        // action for new username
        if (!localStorage.getItem('username')) {
            var username = document.querySelector('#modalInput').value;
            username=username.charAt(0).toUpperCase() + username.slice(1);
            socket.emit('new username',{'username':username});
        } else {
            var channelName = document.querySelector('#modalInput').value;
            channelName=channelName.charAt(0).toUpperCase() + channelName.slice(1);
            socket.emit('new channel',{'channel':channelName});
        }
    };
    //iF button empty disable as auth
    $('kbd').on('click',function (){
  // document.querySelector('kbd').onclick = ()=>{
        $("#myModal").modal({backdrop: 'static', keyboard: false});
        //document.querySelector('#myModal').modal({backdrop: 'static'}).disabled = false;
        document.querySelector('#myModal').modal({backdrop: 'static'}).disabled = false;
        //document.querySelector()
        document.querySelector('.modal-title').innerHTML = "Add a Channel";
        document.querySelector('#modalInput').value = "";
        document.querySelector('#modalButton').disable=true;
    });
    document.querySelector('#username').innerHTML = localStorage.getItem('username');
});// end of the document ready
//});
