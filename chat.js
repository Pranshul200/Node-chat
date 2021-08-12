const socket = io()

//Elements 
const $messageForm = document.querySelector('#message-form')        //the dollar sign used is just a convention followed for the variables which comes from teh dom
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocation = document.querySelector('#send-location')
const $message = document.querySelector("#message")                 //the area where new messages will be shown in browser

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML   //get the message
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//Option
// Here we parse the string from location.search
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })  //get username and room name from the form filled by user

const autoscroll = () => {
    // New message element
    const $newMessage = $message.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)      //as the below function offsetHeight dosent account for the margin, we manually have to get it fro css and convert the same
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $message.offsetHeight // return the visible height

    //Height of messages container
    const containerHeight = $message.scrollHeight // total height we able to scroll

    //How far have I scrolled
    const scrollOffset = $message.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $message.scrollTop = $message.scrollHeight
    }
}
// Note while socket.on we cnfm that the argument (variable) emit from client is same as here this case that is message
socket.on('message', (message) => {   //on accpets the mesage, note this first argument, the name should match with the name that sen the message
    
    const html = Mustache.render(messageTemplate, { //copy message o heml var
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')        //moment is a library of javascript we installed in index.html script, which allows us to format data and time form the timestamp we get, note that timestamp is the number of hours from a particular reference date
    })                                                      //we use h to dispay time as 1 not 01
    $message.insertAdjacentHTML('beforeend', html)  //add the messag to the empty area
    autoscroll()
})    

 
socket.on('locationMessage', (message) => {   
    
    const html = Mustache.render(locationMessageTemplate, { 
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })   
    $message.insertAdjacentHTML('beforeend', html) 
    autoscroll()
})  

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    
    $messageFormButton.setAttribute('disabled', 'disabled')     //disable once clicked so that same message cannot be send twice

    const message = e.target.elements.message.value
    
    socket.emit('sendMessage', message, (error) => { //getting response of click from index.html using the document querry and sending it to index.js
        $messageFormButton.removeAttribute('disabled')  //re-enable it
        $messageFormInput.value = ''    //clear inptut once message send
        $messageFormInput.focus() //focus goes back to the input

        if (error) {        //the last argument of the emit is the acknowledge, it is used to tells that message was deleivered, though its not complusary to add
            return console.log(error)
        } 
        
        console.log('Message delivered')
    })        
})

$sendLocation.addEventListener('click', () => {
    if(!navigator.geolocation) {        //if this feature doesnot exist in browser
        return alert('Geolocation is not supported in your browser')
    }

    $sendLocation.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocation.removeAttribute('disabled')
            console.log('Location shared')
        })

        
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = './'
    }
})