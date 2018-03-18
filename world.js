var playerBodies = []

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

// ensure objects bounce when edge collision is detected
world.add( Physics.behavior('body-impulse-response') );

// add mouse-follow
var mouseFollow = Physics.behavior('mouse-follow', {
    maxVel: 1,
    el: window,
})
mouseFollow.applyTo( playerBodies )
world.add( mouseFollow );

// subscribe to ticker to advance the simulation
Physics.util.ticker.on(function( time, dt ){

    world.step( time );
});

// start the ticker
Physics.util.ticker.start();



// add some gravity
//world.add( Physics.behavior('constant-acceleration') );

// add a circle
var circle = Physics.body('circle', {
    x: 50, // x-coordinate
    y: 30, // y-coordinate
    vx: 0.2, // velocity in x-direction
    vy: 0.01, // velocity in y-direction
    radius: 20
});
world.add( circle );
playerBodies.push( circle )
mouseFollow.applyTo( playerBodies )