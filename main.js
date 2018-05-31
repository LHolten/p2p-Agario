var Client = require('bittorrent-tracker/client')
var randomBytes = require('randombytes')
var sha1 = require('simple-sha1')

// var Direction = Object.freeze({left:0, right:1, up:2, down:3})

// var spatialMesh = new CircularArray()
// var secondSpatialMesh = {}
var UpdateMessage
var IntroductionMessage

var peerId = sha1.sync(randomBytes(20))
var infoHash = sha1.sync('Unnamedcell FFA 1')

var connections = {}
connections[ peerId ] = {}
connections[ peerId ].cells = {}
connections[ peerId ].target = {x: 100, y: 100}

var opts = {
    peerId: peerId,
    infoHash: infoHash,
    announce: [
        'wss://tracker.openwebtorrent.com:443/announce',
        //'wss://tracker.fastcast.nz:443/announce'
    ],
}
var client = new Client( opts )

client.on( 'error', function( err ){
    // fatal client error!
    console.log( err.message )
})

client.on( 'update', function( data ){
    console.log( 'got an announce response from tracker: ' + data.announce )
    console.log( 'number of seeders in the swarm: ' + data.complete )
    console.log( 'number of leechers in the swarm: ' + data.incomplete )
})

client.on( 'warning', function( err ){
    // a tracker was unavailable or sent bad data to the client. you can probably ignore it
    console.log( err.message )
})

function handle_data( data, peer ){
    if( data instanceof Uint8Array ){
        // console.log( 'recieved data', data, peer.id )
        var message

        try {
            message = UpdateMessage.decode( data )
        } catch (e) {
            console.log( 'invalid message received', e )
            return
        }

        // console.log( 'message:' , message, peer.id )
        if( message.action ){
            if( typeof message.action.targetSplits === 'number' ){
                if( connections[ peer.id ].targetSplits < message.action.targetSplits ){
                    // split( peer.id, message.action.targetSplits - connections[ peer.id ].targetSplits )
                    connections[ peer.id ].targetSplits = message.action.targetSplits
                }
            }
            if( typeof message.action.targetX === 'number' && typeof message.action.targetY === 'number' ){
                var target = {x: message.action.targetX, y: message.action.targetY }
                connections[ peer.id ].target = target
            }
        }

        if( message.cells ){
            for( id in message.cells ){
                var cell = message.cells[ id ]
                if( typeof cell.owner === 'string' && typeof cell.id === 'number' && typeof cell.radius === 'number' ){
                    var body
                    if( connections[ cell.owner ] && connections[ cell.owner ].cells && connections[ cell.owner ].cells[ cell.id ] ){
                        body = connections[ cell.owner ].cells[ cell.id ]
                    }else if( connections[ cell.owner ] && connections[ cell.owner ].target ){
                        body = add_cell( connections[ cell.owner ].target, cell.owner, cell.id )
                    }
                    body.connections[ peer.id ] = cell.radius
                }
            }
        }
    }
}

client.on( 'peer', function( peer ){
    
    if( connections[ peer.id ] && connections[ peer.id ].peer ){
        console.log( 'already connected, destroying extra connection' )
        peer.destroy( 'already connected message' )
    }else{
        if( connections[ peer.id ] ){
            connections[ peer.id ].peer = peer
        }else{
            connections[ peer.id ] = {peer: peer}
        }
        
        console.log( 'new peer', peer.id, 'sending all cells' )
    }

    peer.on( 'connect', function(){
        send_all_cells( peer )
    })

    peer.on( 'data', function( data ){
        handle_data( data, peer )
    })

    peer.on( 'close', function(){
        if( connections[ peer.id ] && connections[ peer.id ].peer === peer){  
            console.log( 'connection lost, dissabling control' )
            remove_owner_cells( peer.id )
            // set_owner_disconnected( peer.id )
            // remove peer from connection list
            delete connections[ peer.id ].peer
        }
    })

    peer.on( 'error', function( err ){
        console.log( err )
    })
})

function broadcast_mass( cell ){
    var pos = connections[ peerId ].target
    var payload = { cells: [{ owner: cell.owner, id: cell.id, radius: cell.radius }], action: { targetX: pos.x, targetY: pos.y } }
    console.log('send', payload)
    
    var errMsg = UpdateMessage.verify(payload)
    if( errMsg ){
        throw Error( errMsg )
    }

    var buffer = UpdateMessage.encode( payload ).finish()

    broadcast( buffer )
}

function broadcast_action( pos ){
    var payload = { action: { targetX: pos.x, targetY: pos.y } }
    // console.log('send', payload)
    
    var errMsg = UpdateMessage.verify(payload)
    if( errMsg ){
        throw Error( errMsg )
    }

    var buffer = UpdateMessage.encode( payload ).finish()

    broadcast( buffer )
}

function send_all_cells( peer ){
    var cells = []

    // console.log( 'all cells', allCells )
    for( id in allCells ){
        cells.push({ owner: allCells[ id ].owner, id: allCells[ id ].id, radius: allCells[ id ].radius })
    }

    var pos = connections[ peerId ].target
    var payload = { cells: cells, action: { targetX: pos.x, targetY: pos.y } }

    var errMsg = UpdateMessage.verify(payload)
    if( errMsg ){
        throw Error( errMsg )
    }

    var buffer = UpdateMessage.encode( payload ).finish()

    peer.send( buffer )
    // console.log( 'send', payload, 'buffer form', buffer )
}

function broadcast( buffer ){
    for( id in connections ){
        if( id !== peerId && connections[ id ].peer && connections[ id ].peer.connected ){
            connections[ id ].peer.send( buffer )
        }
    } 
}

protobuf.load( "connection.proto", function( err, root ) {
    if (err){
        throw err;
    }

    UpdateMessage = root.lookupType("UpdateMessage");
    IntroductionMessage = root.lookupType("IntroductionMessage");
    
    // client.setInterval( 5000 )
    client.start()

    // start the ticker
    Physics.util.ticker.start();

    //give us a new cell and broadcast it!
    var pos = connections[ peerId ].target
    broadcast_mass( add_cell( pos, peerId, 1 ) )
});

