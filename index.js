const path = require('path')
const http = require('http')
const express= require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocation } = require('./utils/messages')
const { addUser, getUser, getUsersInRoom, removeUser } = require('./utils/users')

const app = express()
const server = http.createServer(app)       //is automaticallydone by express, but since we need to include socket we are doing it maunally
const io = socketio(server)     //we did the above stepp as socket needs access to raw server

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// Socket.ioid different from HTTP as it have dual direction transfer of data from client to server as well server to client

io.on('connection', (socket) => {       //runsthis when someone got connected
    console.log('New WebSocket connection')

    socket.on('join', (options, callback) => {     //to get username and room name user wants to join
        const { error, user } = addUser({ id: socket.id, ...options }) // To get the id we can directlye use socket.id it retuen the unique id regarding that directly
        
        if(error) {
            return callback(error)
        }

        socket.join(user.room)
        
        socket.emit('message', generateMessage('Admin', 'Welcome!'))   //To send an event we use socket.emit
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`)) //socket.broadcast.emit basically tell all the users except the joined one tht a a new user has joined
        io.to(user.room).emit('roomData',{  //io.to.emit allow us to send msg to all the person in a room rather han sending in all the rooms similarly socket.broadcast.to.emit send the msg to every one in the room rather than sending that particular user 
            room: user.room, 
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        
        const filter = new Filter()

        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocation(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))      //to get location on a map
        callback()
    })

    // Incase of socket.emit it only send the msg to a particular client but if we do io.emit it will send to all the users

    socket.on('disconnect', () => { //predefined disconnect function
        const user = removeUser(socket.id)
        
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`)) //since user has left we need not use broadcast
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})
