var Client = require('bittorrent-tracker/client')
var randomBytes = require('randombytes')
var sha1 = require('simple-sha1')


var player_list = []


var peerId = sha1.sync(randomBytes(20))
var infoHash = sha1.sync('Unnamedcell FFA 1')

var opts = {
    peerId: peerId,
    infoHash: infoHash,
    announce: [
        'wss://tracker.openwebtorrent.com:443/announce',
        'wss://tracker.fastcast.nz:443/announce'
    ],
}
var client = new Client(opts)

client.on('error', function (err) {
    // fatal client error!
    console.log(err.message)
})

client.on('update', function (data) {
    console.log('got an announce response from tracker: ' + data.announce)
    console.log('number of seeders in the swarm: ' + data.complete)
    console.log('number of leechers in the swarm: ' + data.incomplete)
})

client.on('warning', function (err) {
    // a tracker was unavailable or sent bad data to the client. you can probably ignore it
    console.log(err.message)
})

client.once('peer', function (peer) {
    player_list.push(peer)
})

client.setInterval(5000)
client.start()