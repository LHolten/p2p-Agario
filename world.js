var playerBodies = []
var currentStep = 0
var world = Physics()

const NEW = 0

var colors = {
    white: '0xFFFFFF',
    violet: '0x542437',
    blue: '0x53777A'
}

var renderer = Physics.renderer('pixi', {
    meta: true,
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
world.add( Physics.behavior( 'edge-collision-detection', {
    aabb: viewportBounds,
    restitution: 0.99,
    cof: 0.99
}));

world.add([
    Physics.behavior( 'body-collision-detection' ),
    Physics.behavior( 'sweep-prune' )
])


// ensure objects bounce when edge collision is detected
world.add( Physics.behavior( 'body-impulse-response' ) );

// add mouse-follow
var mouseFollow = Physics.behavior( 'mouse-follow', {
    maxVel: 0.5,
    el: window,
})
mouseFollow.applyTo( playerBodies )
world.add( mouseFollow );


// subscribe to ticker to advance the simulation
Physics.util.ticker.on(function( time, dt ){
    currentStep = time
    world.step( time );
});

// start the ticker
Physics.util.ticker.start();


function add_cell( x, y, owner ){
    //console.log( 'new cell with owner', owner )
    var circle = Physics.body( 'circle', {
        x: x, // x-coordinate
        y: y, // y-coordinate
        vx: 0.0, // velocity in x-direction
        vy: 0.0, // velocity in y-direction
        radius: 20,
        owner: owner
    });
    world.add( circle );

    if( circle.owner === 'player' ){
        playerBodies.push( circle )
        mouseFollow.applyTo(playerBodies)
    }
    return circle
}

function player_cells(){
    /*var message = [][]
    for (body in playerBodies) {
        message.push([body.state.pos.toString, body.mass]) //body.geometry.radius
    }*/
    var body = playerBodies[0]
    return Uint8Array.from([ NEW, currentStep, body.state.pos.x, body.state.pos.y, body.mass ])
}

function remove_owner_cells( owner ){
    var bodies = world.getBodies()
    for( i in bodies ){
        if( bodies[ i ].owner === owner ){
            world.removeBody( bodies[ i ] )
            console.log( 'removed cell' )
        }
    }
}