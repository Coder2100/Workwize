//$(function(){
$(document).ready(function() {

    var socket=io.connect(location.protocol+'//'+document.domain+':'+location.port);
    privateWindow=false;
    inRoom=false;
    socket.on('connect',()=>{
        $('#messageInput').on("keyup",function(key) {
            activeChannel=$("#channelList .active").attr('id');
            //broadcast to all
            if (key.keyCode==13 && $(this).val()!="" && !privateWindow && !inRoom) {
                const mymessage=$(this).val();
                const username=localStorage.getItem('username');
                const time=new Date().toLocaleString();
                $('#messageInput').val("")
                socket.emit('submit to all',{'mymessage':mymessage,'username':username,'time':time});
            }//send to room
            if (key.keyCode==13 && $(this).val()!="" && !privateWindow && inRoom) {
                const mymessage=$(this).val();
                const username=localStorage.getItem('username');
                const time=new Date().toLocaleString();
                $('#messageInput').val("")
                socket.emit('submit to room',{'channel':activeChannel,'mymessage':mymessage,'username':username,'time':time});
            //send private
            } else if (key.keyCode==13 && $(this).val()!="" && privateWindow && !inRoom) {
                const mymessage=$(this).val();
                const username=localStorage.getItem('username');
                const username2=localStorage.getItem('activeMessage');
                const time=new Date().toLocaleString();
                $('#messageInput').val("")
                socket.emit('private',{'mymessage':mymessage,'username':username,'time':time,'username2':username2});
            }
        });
        $('#channelList').on('click','li', function(){
            $('#messageInput').focus();
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
                socket.emit('leave',{'channel':activeChannel,'mymessage':'away','username':username,'time':time});
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

        if (!localStorage.getItem('username')) {
            $("#myModal").modal({backdrop: 'static', keyboard: false});
            $('.modal-title').text("Please enter your username");
            $('#modalInput').val("");
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
                $("#myModal").modal({backdrop: 'static', keyboard: false});
                $('.modal-title').text(data["error"]);
                $('#modalInput').val("");
                $("#modalButton").attr('disabled',true);
            }, 900);
        } else {
            localStorage.setItem('username',data["username"]);
            $('#username').text(localStorage.getItem('username'));
            $('#General').click();
            $('#messageInput').focus();
        }
    });

    socket.on('add channel', data=> {
        if (data["error"]!="") {
            window.setTimeout(function () {
                $("#myModal").modal({backdrop: 'static', keyboard: false});
                $('.modal-title').text(data["error"]);
                $('#modalInput').val("");
                $("#modalButton").attr('disabled',true);
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
                $('#inbox').append(li);
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
                        $('#inbox').append(li);
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
                    $('#inbox').append(li);
                }
            }
        }
        $('#inbox li').on('click', function(){
            $('#messageInput').focus();
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

    $("#modalButton").on('click', function () {
        // action for new username
        if (!localStorage.getItem('username')) {
            var username=$('#modalInput').val();
            username=username.charAt(0).toUpperCase() + username.slice(1);
            socket.emit('new username',{'username':username});
        // action for new channelname
        } else {
            var channelName=$('#modalInput').val();
            channelName=channelName.charAt(0).toUpperCase() + channelName.slice(1);
            socket.emit('new channel',{'channel':channelName});
        }
    });

    //little plus icon
    $('kbd').on('click',function (){
        $("#myModal").modal({backdrop: 'static', keyboard: false});
        $('.modal-title').text("Please enter channel name");
        $('#modalInput').val("");
        $("#modalButton").attr('disabled',true);
    });

    $('#username').text(localStorage.getItem('username'));
});
