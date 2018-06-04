var Client = require('bittorrent-tracker/client')
var randomBytes = require('randombytes')
var sha1 = require('simple-sha1')

// var Direction = Object.freeze({ eft:0, right:1, up:2, down:3})

// var spatialMesh = new CircularArray()
// var secondSpatialMesh = {}
var UpdateMessage
var IntroductionMessage

var peerId = sha1.sync(randomBytes(20))
var infoHash = sha1.sync('Unnamedcell FFA 1')

var connections = {}
initialize_owner(peerId)
connections[peerId].targetSplits = 0
connections[peerId].splits = 0
connections[peerId].target = { x: 0, y: 0 }

var opts = {
    peerId: peerId,
    infoHash: infoHash,
    announce: [
        'wss://tracker.openwebtorrent.com:443/announce',
        //'wss://tracker.fastcast.nz:443/announce'
   ],
}
var client = new Client(opts)

client.on('error', function(err) {
    // fatal client error!
    console.log(err.message)
})

client.on('update', function(data) {
    console.log('got an announce response from tracker: ' + data.announce)
    console.log('number of seeders in the swarm: ' + data.complete)
    console.log('number of leechers in the swarm: ' + data.incomplete)
})

client.on('warning', function(err) {
    // a tracker was unavailable or sent bad data to the client. you can probably ignore it
    console.log(err.message)
})

function handle_data(data, peer) {
    if (data instanceof Uint8Array) {
        // console.log('recieved data', data, peer.id)
        try {
            var message = UpdateMessage.decode(data)
        } catch(e) {
            console.log('invalid message received', e)
            return
        }

        console.log('message:', message)
        if (message.action) {
            if (typeof connections[peer.id].targetSplits === 'undefined') {
                connections[peer.id].targetSplits = message.action.targetSplits
                connections[peer.id].splits = message.action.targetSplits
            } else if (connections[peer.id].targetSplits < message.action.targetSplits) {
                connections[peer.id].targetSplits = message.action.targetSplits
                split_player(peer.id)
            }

            connections[peer.id].target = { x: message.action.targetX, y: message.action.targetY }
        }
        
        for (id in message.cells) {
            let cell = message.cells[id]

            if (!connections[cell.owner]) {
                initialize_owner[cell.owner]
            }

            if (connections[cell.owner].cells[cell.id]) {
                var body = connections[cell.owner].cells[cell.id]
            } else {
                var body = add_cell(undefined, cell.owner, cell.id)
                connections[cell.owner].cells[cell.id] = body
            }
            body.connections[peer.id] = cell.radius
            update_radius(body)
        }
    }
}

client.on('peer', function(peer) {
    
    if (connections[peer.id] && connections[peer.id].peer) {
        console.log('already connected, destroying extra connection')
        peer.destroy('already connected message')
    } else {
        if (!connections[peer.id]) {
            initialize_owner(peer.id)
        }
        connections[peer.id].peer = peer
        
        console.log('new peer', peer.id, 'sending all cells')
    }

    peer.on('connect', function() {
        send_all_cells_and_action(peer)
    })

    peer.on('data', function(data) {
        handle_data(data, peer)
    })

    peer.on('close', function() {
        if (connections[peer.id] && connections[peer.id].peer === peer) {
            console.log('connection lost, dissabling control')
            remove_owner_cells(peer.id)
            // set_owner_disconnected(peer.id)
            // remove peer from connection list
            delete connections[peer.id].peer
            delete connections[peer.id]
        }
    })

    peer.on('error', function(err) {
        console.log(err)
    })
})

function broadcast_mass(cell) {
    var payload = { cells: [{ owner: cell.owner, id: cell.id, radius: cell.connections[peerId] }] }
    console.log('send', payload)
    
    var errMsg = UpdateMessage.verify(payload)
    if (errMsg) {
        throw Error(errMsg)
    }

    var buffer = UpdateMessage.encode(payload).finish()

    broadcast(buffer)
}

function broadcast_action(pos = connections[peerId].target, splits = connections[peerId].targetSplits) {
    var payload = { action: { targetX: pos.x, targetY: pos.y, targetSplits: splits } }
    console.log('send', payload)
    
    var errMsg = UpdateMessage.verify(payload)
    if (errMsg) {
        throw Error(errMsg)
    }

    var buffer = UpdateMessage.encode(payload).finish()

    broadcast(buffer)
}

function send_all_cells_and_action(peer) {
    var cells = []

    // console.log('all cells', allCells)
    for (id in allCells) {
        cells.push( { owner: allCells[id].owner, id: allCells[id].id, radius: allCells[id].radius } )
    }

    var pos = connections[peerId].target
    var payload = { cells: cells, action: { targetX: pos.x, targetY: pos.y } }

    var errMsg = UpdateMessage.verify(payload)
    if (errMsg) {
        throw Error(errMsg)
    }

    var buffer = UpdateMessage.encode(payload).finish()

    peer.send(buffer)
    // console.log('send', payload, 'buffer form', buffer)
}

function broadcast(buffer) {
    for (id in connections) {
        if (id !== peerId && connections[id].peer && connections[id].peer.connected) {
            connections[id].peer.send(buffer)
        }
    } 
}

function initialize_owner(id) {
    connections[id] = {
        cells: {},
    }
}

protobuf.load("connection.proto", function(err, root) {
    if (err) {
        throw err;
    }

    UpdateMessage = root.lookupType("UpdateMessage");
    IntroductionMessage = root.lookupType("IntroductionMessage");
    
    // client.setInterval(5000)
    client.start()

    // start the ticker
    Physics.util.ticker.start();

    if (window.PointerEvent) {
        element.addEventListener('pointermove', move);
    } else {
        element.addEventListener('mousemove', move);
        element.addEventListener('touchmove', move);
    }

    element.addEventListener('keyup', on_key_up)
});

