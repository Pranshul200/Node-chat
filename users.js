const users = []

const addUser = ({ id, username, room }) => {
    //Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    //Validate the data
    if(!username || !room) {
        return {
            error: 'Username and room are required'
        }
    }

    //Check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    //Validate username
    if(existingUser) {
        return {
            error: 'Username is in use!'
        }
    }

    //Store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)

    if(index !== -1) {
        return users.splice(index, 1)[0]    //splice to remove the 1 user and [0] is to print the first property ie the username of that user
    }
}

module.exports = {
    addUser, 
    getUser, 
    getUsersInRoom,
    removeUser
}