

function loadMessages(data) {
        $('#messages').html("");
        for (x in data['channels'][activeChannel]) {
            const media=document.createElement('div');
            if (data['channels'][activeChannel][x]['username']==localStorage.getItem('username')) {
                media.className=' media d-flex flex-row-reverse';
            }else {
                media.className=' media';
            }
            const mediaLeft=document.createElement('div');
            mediaLeft.className=' media-left';
            const mediaBody=document.createElement('div');
            mediaBody.className=' media-left';
            const username=document.createElement('span');
            username.innerHTML=data['channels'][activeChannel][x]['username']
            username.className='text-danger';
            const p=document.createElement('p');
            p.innerHTML=data['channels'][activeChannel][x]['text']
            //const avatar=document.createElement('img');
          //  avatar.className='media-object';
            //avatar.src='static/avatar.png';
            const time=document.createElement('small');
            time.innerHTML=data['channels'][activeChannel][x]['time'];
            time.className='text-muted pl-2';

            $('#messages').append(media);
            media.append(mediaLeft);
            media.append(mediaBody);
            mediaBody.append(username);
            mediaBody.append(time);
            mediaBody.append(p);
            //mediaLeft.append(avatar);

            $('#messages').scrollTop(500000);
    }
}

function loadPrivateMessages(data,otherUser) {
    $('#messages').html("");
    for (message in data['privateMessages'][localStorage.getItem('username')][otherUser]) {
        const media=document.createElement('div');
        if (data['privateMessages'][localStorage.getItem('username')][otherUser][message]['username']==localStorage.getItem('username')) {
            media.className=' media d-flex flex-row-reverse';
        }else {
            media.className=' media';
        }
        const mediaLeft=document.createElement('div');
        mediaLeft.className=' media-left';
        const mediaBody=document.createElement('div');
        mediaBody.className=' media-left';
        const username=document.createElement('span');
        username.innerHTML=data['privateMessages'][localStorage.getItem('username')][otherUser][message]['username']
        username.className='text-danger';
        const p=document.createElement('p');
        p.innerHTML=data['privateMessages'][localStorage.getItem('username')][otherUser][message]['text']
        //const avatar=document.createElement('img');
      //  avatar.className='media-object';
        //avatar.src='static/avatar.png';
        const time=document.createElement('small');
        time.innerHTML=data['privateMessages'][localStorage.getItem('username')][otherUser][message]['time'];
        time.className='text-muted pl-2';

        $('#messages').append(media);
        media.append(mediaLeft);
        media.append(mediaBody);
        mediaBody.append(username);
        mediaBody.append(time);
        mediaBody.append(p);
      //  mediaLeft.append(avatar);

        $('#messages').scrollTop(500000);
}
}

function loadChannels(data) {
    for (channel in data['channels']){
        appendChannel(channel);
    }

}
function appendChannel(channel) {
    const li=document.createElement('li');
    li.className='list-group-item p-1';
    li.innerHTML='# '+channel.charAt(0).toUpperCase() + channel.slice(1);
    li.setAttribute("id", channel);
    $('#channelList').append(li);
}

function chooseUser(user) {
    if (user!=localStorage.getItem('username')) {
        const username=localStorage.getItem('username');
        const time=new Date().toLocaleString();
        activeChannel=localStorage.getItem('activeChannel');
        privateWindow=true;
        inRoom=false;
        $('#messages').html("");
        localStorage.setItem('activeMessage',user);
        if (activeChannel!="General") {
            socket.emit('leave',{'channel':activeChannel,'mymessage':'away','username':username,'time':time});
        }
    }else {

    }
    $('#messageInput').focus();
}
