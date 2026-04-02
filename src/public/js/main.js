$(function(){
    const socket = io();

    const $messageForm = $('#message-form');
    const $messageBox = $('#message');
    const $chat = $('#chat');

    const $nickForm = $('#nickForm');
    const $nickError = $('#nickError');
    const $nickname = $('#nickname');
    const $users = $('#usernames');

    let myNickname = '';

    $nickForm.submit( e => {
        e.preventDefault();

        // Limpieza: no permitir nombres vacíos o solo espacios
        const nick = $nickname.val().trim();
        if(nick === ''){
            $nickError.html('<div class="alert alert-warning">El nombre no puede estar vacío.</div>');
            return;
        }

        socket.emit('nuevo usuario', nick, data => {
            if(data){
                myNickname = nick;
                $('#nickWrap').hide();
                $('#contentWrap').show();
            } else {
                $nickError.html('<div class="alert alert-danger">El nombre de usuario ya existe.</div>');
            }
            $nickname.val('');
        });
    });

    $messageForm.submit( e => {
        e.preventDefault();

        // Limpieza: no enviar mensajes vacíos o solo espacios
        const msg = $messageBox.val().trim();
        if(msg === '') return;


        socket.emit('Enviar mensaje', msg, data => {
        if(data) $chat.append(`<p class="error">${data}</p>`);
            });
        $messageBox.val('');
        $messageBox.focus();
    });

    // Formato de mensajes: propios vs ajenos con estilos distintos
    socket.on('Nuevo mensaje', function (data){
        const isMe = data.nick === myNickname;
        const msgHtml = isMe
            ? `<div class="msg msg-me"><span class="msg-nick">Tú</span> ${data.msg}</div>`
            : `<div class="msg msg-other"><span class="msg-nick">${data.nick}</span> ${data.msg}</div>`;
        $chat.append(msgHtml);
        // Auto-scroll al último mensaje
        $chat.scrollTop($chat[0].scrollHeight);
    });

    // Notificación de conexión de nuevo usuario
    socket.on('usuario conectado', function(nick){
        $chat.append(`<div class="msg-system"> <em>${nick} se ha unido al chat</em></div>`);
        $chat.scrollTop($chat[0].scrollHeight);
    });

    // Notificación de desconexión
    socket.on('usuario desconectado', function(nick){
        $chat.append(`<div class="msg-system"> <em>${nick} ha salido del chat</em></div>`);
        $chat.scrollTop($chat[0].scrollHeight);
    });


    socket.on('whisper', data => {
    $chat.append(`<p class="whisper"><b>${data.nick}:</b> ${data.msg}</p>`);
    $chat.scrollTop($chat[0].scrollHeight);
    });
   
    socket.on('Cargando viejos mensajes', msgs => {
    for(let i = 0; i < msgs.length; i++){
        displayMsg(msgs[i]);
    }
});

function displayMsg(data) {
    $chat.append(`<p class="whisper"><b>${data.nombreUsuario}:</b> ${data.mensaje}</p>`);
    $chat.scrollTop($chat[0].scrollHeight);
}

    socket.on('usernames', data => {
        let html = '';
        for(let i = 0; i < data.length; i++){
            const esYo = data[i] === myNickname ? ' <span class="badge bg-warning text-dark">Tú</span>' : '';
            html += `<p><i class="fas fa-user"></i> ${data[i]}${esYo}</p>`;
        }
        $users.html(html);
    });
});