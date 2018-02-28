var Client = require('bittorrent-tracker/client')
var randomBytes = require('randombytes')
var sha1 = require('simple-sha1')

var world = Physics()

var colors = {
    white: '0xFFFFFF',
    violet: '0x542437',
    blue: '0x53777A'
}

var renderer = Physics.renderer('pixi', {
    meta: true, // don't display meta data
    width: window.innerWidth,
    height: window.innerHeight,
    styles: {
        'circle' : {
            strokeStyle: colors.blue,
            lineWidth: 1,
            fillStyle: colors.blue,
            angleIndicator: colors.white,
            fillAlpha: 1,
            strokeAlpha: 1,
            alpha: 1
        },
    },
});

// add the renderer
world.add( renderer );
// render on each step
world.on('step', function(){
    world.render();
});

// bounds of the window
var viewportBounds = Physics.aabb(0, 0, window.innerWidth, window.innerHeight);

// constrain objects to these bounds
world.add(Physics.behavior('edge-collision-detection', {
    aabb: viewportBounds,
    restitution: 0.99,
    cof: 0.99
}));

// add a circle
world.add(
    Physics.body('circle', {
        x: 50, // x-coordinate
        y: 30, // y-coordinate
        vx: 0.2, // velocity in x-direction
        vy: 0.01, // velocity in y-direction
        radius: 20
    })
);

// ensure objects bounce when edge collision is detected
world.add( Physics.behavior('body-impulse-response') );

// add some gravity
world.add( Physics.behavior('constant-acceleration') );

// subscribe to ticker to advance the simulation
Physics.util.ticker.on(function( time, dt ){

    world.step( time );
});

// start the ticker
Physics.util.ticker.start();

//local world set up


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