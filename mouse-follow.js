
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
            // the element to monitor
            el: null,
            // time between move events
            moveThrottle: 1000 / 100 | 0,
            // maximum velocity clamp
            maxVel: 5
        },
        getElementOffset = function( el ){
            var curleft = 0
                ,curtop = 0
                ;

            if (el.offsetParent) {
                do {
                    curleft += el.offsetLeft;
                    curtop += el.offsetTop;
                } while (el = el.offsetParent);
            }

            return { left: curleft, top: curtop };
        };

    return {
        // extended
        init: function( options ){

            var self = this;

            // call parent init method
            parent.init.call( this );
            this.options.defaults( defaults );
            this.options( options );

            // vars
            this.pos = {x: 0, y: 0}
            this.el = typeof this.options.el === 'string' ? document.getElementById(this.options.el) : this.options.el;
            
            if ( !this.el ){
                throw "No DOM element specified";
            }

            self.move = Physics.util.throttle(function move( e ){
                var pos
                    ,touch
                    ,offset
                    ,touchIndex
                    ,l
                    ;

                if ( self._world ){

                    // Adjust for PointerEvent and older browsers
                    if ( !e.changedTouches ) {
                        e.changedTouches = [ e ];
                    }

                    offset = getElementOffset( self.el );

                    for ( touchIndex = 0, l = e.changedTouches.length; touchIndex < l; touchIndex++) {
                        touch = e.changedTouches[touchIndex];
                        pos = {x: touch.pageX - offset.left, y: touch.pageY - offset.top };
                        this.pos = pos;
                        self._world.emit('interact:move', pos);
                    }
                }
            }, self.options.moveThrottle);
        },

        // extended
        connect: function( world ){

            // subscribe the .behave() method to the position integration step
            world.on('integrate:positions', this.behave, this);

            if ( window.PointerEvent ) {
                this.el.addEventListener('pointermove', this.move);
            } else {
                this.el.addEventListener('mousemove', this.move);
                this.el.addEventListener('touchmove', this.move);
            }
        },

        // extended
        disconnect: function( world ){

            // unsubscribe when disconnected
            world.off('integrate:positions', this.behave, this);

            if ( window.PointerEvent ) {
                this.el.removeEventListener('pointermove', this.move);
            } else {
                this.el.removeEventListener('mousemove', this.move);
                this.el.removeEventListener('touchmove', this.move);
            }
        },

        // extended
        behave: function( data ){

            var state,
                speed = this.options.maxVel,
                bodies = this.getTargets();

            for ( var i = 0, l = bodies.length; i < l; ++i ){
                state = bodies[ i ].state;
                state.vel.clone( self.pos ).vsub( state.pos ).normalize().mult( speed );
            }
        }
    };
});

