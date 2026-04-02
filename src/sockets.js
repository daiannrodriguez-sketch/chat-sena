const Chat = require('./Models/Chat');
module.exports = function (io){

    let users = {};

    io.on('connection', async socket =>{
    console.log("Nuevo Usuario conectado");

    let messages = await Chat.find({}).limit(8);
    socket.emit('Cargando viejos mensajes', messages);

        socket.on('nuevo usuario', (data, cb) => {
            // Limpieza de datos: rechazar nombres vacíos o solo espacios
            if (!data || data.trim() === '') {
                cb(false);
                return;
            }

            const cleanName = data.trim();

            if(cleanName in users) {
                cb(false);
            } else {
                cb(true);
                socket.nickname = cleanName;
                users [socket.nickname] = socket;
                updateNicknames();

                // Notificación de conexión: avisar a todos que alguien se unió
                io.sockets.emit('usuario conectado', socket.nickname);
            }
        });

        socket.on("Enviar mensaje", async function(data, cb){
        if (!data || data.trim() === '') return;

    var msg = data.trim();

    if(msg.substr(0, 3) === '/w '){
        msg = msg.substr(3);
        const index = msg.indexOf(' ');

        if(index !== -1){
            var name = msg.substring(0, index);
            var msg = msg.substring(index + 1);

            if(name in users){
                users[name].emit('whisper', { msg, nick: socket.nickname });
                socket.emit('whisper', { msg, nick: socket.nickname });
            } else {
                cb('Error! Por favor entra un usuario validado');
            }
        } else {
            cb('Error! Por favor ingresa tu mensaje');
        }
    } else {
        var newMsg = new Chat({
            mensaje: msg,
            nombreUsuario: socket.nickname
        });
        await newMsg.save();

        io.sockets.emit('Nuevo mensaje', {
            msg: msg,
            nick: socket.nickname
        });
    }
});

        socket.on('disconnect', data => {
            if(!socket.nickname) return;
            delete users[socket.nickname];
            updateNicknames();

            // Notificación de desconexión
            io.sockets.emit('usuario desconectado', socket.nickname);
        });

        function updateNicknames(){
    io.sockets.emit('usernames', Object.keys(users));
}
    });
}