
/**
 * class InteractiveBehavior < Behavior
 *
 * `Physics.behavior('interactive')`.
 *
 *
 * Additional options include:
 * - el: The element of the renderer. What you input as the `el` for the renderer.
 * - moveThrottle: The min time between move events (default: `10`).
 *
 * The behavior also triggers the following events on the world:
 * ```javascript
 * // when a mouse or pointer moves
 * world.on('interact:move', function( data ){
 *     data.x; // the x coord
 *     data.y; // the y coord
 * });
 **/
Physics.behavior('mouse-follow', function( parent ){
    var defaults = {
            // maximum velocity clamp
            maxVel: 5
        }

    return {
        // extended
        init: function( options ){

            var self = this;

            // call parent init method
            parent.init.call( this );
            this.options.defaults( defaults );
            this.options( options );
        },

        // extended
        connect: function( world ){

            // subscribe the .behave() method to the position integration step
            world.on('integrate:positions', this.behave, this);
        },

        // extended
        disconnect: function( world ){

            // unsubscribe when disconnected
            world.off('integrate:positions', this.behave, this);
        },

        // extended
        behave: function( data ){

            var state
            var speed = this.options.maxVel
            var bodies = this.getTargets()
            var target

            for ( var i = 0, l = bodies.length; i < l; ++i ){
                state = bodies[ i ].state;
                target = connections[ bodies[ i ].owner ].target
                state.vel.clone( target ).vsub( state.pos ).normalize().mult( speed );
            }
        }
    };
});

