const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');
// const {numberGen} = require('./utils/randomnumber');


const app = express();
const server = http.createServer(app);
const io = socketio(server)
const bodyParser = require('body-parser');
const { title } = require('process');

// set static folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
    extended: true
}));

//connect to mongoDB
mongoose.connect('mongod://localhost:27017/mydb');

var db = mongoose.connection;

db.on('error', ()=> console.log("error in connecting to database"));
db.once('open', ()=> console.log("Connected to database"));

app.post("/signup", (req,res)=>{
    var name = req.body.name;
    var email = req.body.email;
    var phone = req.body.phone;
    var password = req.body.password;

    var data = {
        "name": name,
        "email": email,
        "phone": phone,
        "password": password,

    }

    db.collection('users').insertOne(data, (err,collection)=>{
        if(err){
            throw err;
        }
        console.log("record inserted successfully!");
    });

    return res.redirect('signup_success.hmtl')

})



const botName = 'Support Bot';

//Display when someone connects
io.on('connection', socket => {
    socket.on('joinRoom', ({username, room})=> {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);
        
    //Tell single client that is connecting = personal message
    socket.emit('message', formatMessage(botName, 'Welcome to Lets Chat Support! Please wait while we connect you to support staff...'));

    //Tell everyone a client has connected except the client connecting
    socket.broadcast
    .to(user.room)
    .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );
    //Send users and room info
    io.to(user.room).emit('roomUsers',{
         room: user.room,
         users: getRoomUsers(user.room)
        });
  
    });


  
   //listen for chatMessage
   socket.on('chatMessage', (msg)=>{
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
   });

    //This runs when client disconnects
    socket.on('disconnect', ()=>{
        const user = userLeave(socket.id);

        if(user){
            //Tells everyone a client has connected including client connecting
            io.to(user.room).emit(
                'message', 
                formatMessage(botName, `${user.username} has left the chat`)) 
        };

        //Send users and room info
        io.to(user.room).emit('roomUsers',{
            room: user.room,
            users: getRoomUsers(user.room)
           });

        
       
     });
 
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT,() => console.log(`Server running on port ${PORT}`));