var Client = require('bittorrent-tracker/client')
var randomBytes = require('randombytes')
var sha1 = require('simple-sha1')


var player_list = {}


var peerId = sha1.sync(randomBytes(20))
var infoHash = sha1.sync('Unnamedcell FFA 1')

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
        console.log('recieved data', data, peer)

        if( data[0] === NEW ){
            console.log('new cell')

            add_cell( data[2], data[3], peer.id )
        }
    }
}

client.on( 'peer', function( peer ){
    peer.on( 'connect', function(){
        if( player_list[ peer.id ] ){
            peer.destroy('already connected')
        }else{
            console.log( 'new player, send cell!' )
            player_list[ peer.id ] = peer
            peer.send( player_cells() )
        }
    })

    peer.on( 'data', function(data){
        handle_data( data, peer )
    })

    peer.on( 'close', function(){
        delete player_list[ peer.id ]
        
        console.log( 'player left, removing cell' )
        remove_owner_cells( peer.id )
    })

    peer.on( 'error', function( err ){
        console.log( err )
    })
})

client.setInterval( 5000 )
client.start()


function broadcast_new_cell( body ){
    var data = Uint8Array.from([ NEW, currentStep, body.state.pos.x, body.state.pos.y, body.mass ])
    console.log('send', data)

    for( id in player_list ){
        player_list[ id ].send( data )
    }
}

//give us a new cell and broadcast it!
broadcast_new_cell( add_cell( 100, 100, 'player' ) )