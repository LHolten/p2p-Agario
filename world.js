var currentStep = 0
var world = new Physics.world({ sleepDisabled: true })
var allCells = []

var colors = {
    white: '0xFFFFFF',
    violet: '0x542437',
    blue: '0x53777A',
    gray: '0x808080'
}

var normalStyle = {
    'circle' : {
        strokeStyle: colors.blue,
        lineWidth: 1,
        fillStyle: colors.blue,
        angleIndicator: colors.white,
        fillAlpha: 1,
        strokeAlpha: 1,
        alpha: 1
    }
}

var disconnectedStyle = {
    'circle': {
        strokeStyle: colors.gray,
        lineWidth: 1,
        fillStyle: colors.gray,
        angleIndicator: colors.white,
        fillAlpha: 1,
        strokeAlpha: 1,
        alpha: 1
    },
}

var renderer = Physics.renderer('pixi', {
    meta: true,
    width: window.innerWidth,
    height: window.innerHeight,
    styles: normalStyle,
});


// add the renderer
world.add(renderer);
// render on each step
world.on('step', function() {
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

world.add([
    Physics.behavior('body-collision-detection'),
    Physics.behavior('sweep-prune')
])


// ensure objects bounce when edge collision is detected
world.add(Physics.behavior('body-impulse-response'));

// add mouse-follow
var mouseFollow = Physics.behavior('mouse-follow', {
    maxVel: 0.5,
})
mouseFollow.applyTo([])
world.add(mouseFollow);

// subscribe to ticker to advance the simulation
Physics.util.ticker.on(function(time, dt) {
    currentStep = time
    world.step(time);
});


function add_cell(pos = { x: 0, y:0 }, owner, id) {
    //console.log('new cell with owner', owner)
    var circle = Physics.body('circle', {
        x: pos.x, // x-coordinate
        y: pos.y, // y-coordinate
        vx: 0.0, // velocity in x-direction
        vy: 0.0, // velocity in y-direction
        radius: 20,
        owner: owner,
        id: id,
        connections: {},
    });
    
    
    if (!connections[owner].cells) {
        connections[owner].cells = {}
    }
    connections[owner].cells[id] = circle

    return circle
}

function remove_owner_cells(owner) {
    for (id in connections[owner].cells) {
        world.removeBody(connections[owner].cells[id])
        allCells.splice(allCells.indexOf(connections[owner].cells[id]), 1)
        console.log('removed cell')
    }
    mouseFollow.applyTo(allCells)        
}

function set_owner_disconnected(owner) {
    for (id in connections[owner].cells) {
        renderer.detach(connections[owner].cells[id].view)
        connections[owner].cells[id].view = renderer.createView(connections[owner].cells[id].geometry, disconnectedStyle)
        console.log('changed style')
    }
}

function set_owner_connected(owner) {
    for (id in connections[owner].cells) {
        renderer.detach(connections[owner].cells[id].view)
        connections[owner].cells[id].view = renderer.createView(connections[owner].cells[id].geometry, normalStyle)
        console.log('changed style')
    }
}

function update_radius(body) {
    var playerCount = Object.keys(connections).length
    var list = Object.values(body.connections).sort()
    var id = Math.floor(playerCount * 0.5)
    if (list[id]) {
        if (body.radius !== list[id]) {
            body.radius = list[id]
            body.connections[peerId] = list[id]
            broadcast_mass(body)
        }

        if (list[id] > 0 && !world.has(body)) {
            body.x = connections[body.owner].target.x
            body.y = connections[body.owner].target.y
            world.add(body)
            allCells.push(body)
            mouseFollow.applyTo(allCells)
        } else if (list[id] <= 0 && world.has(body)) {
            world.removeBody(body)
            allCells.splice(allCells.indexOf(body), 1)
        }
    }
}

function split_player(owner) {
    for (i = connections[owner].splits; i < connections[owner].targetSplits; i++ ) {
        let body = add_cell(connections[owner].target, owner, i)
        // body.connections[owner] = 20
        
        if (i === 0) {
            body.connections[peerId] = 20
            broadcast_mass( body )
        }
        update_radius(body)
    }
    connections[owner].splits = connections[owner].targetSplits
}