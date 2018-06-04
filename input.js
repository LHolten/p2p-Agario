// vars
var element = window
// time between move events
var moveThrottle = 1000 / 10 | 0

if (!element) {
    throw "No DOM element specified";
}

getElementOffset = function(el) {
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

move = Physics.util.throttle(function move(e) {
    var pos
        ,touch
        ,offset
        ,touchIndex
        ,l
        ;

    // Adjust for PointerEvent and older browsers
    if (!e.changedTouches) {
        e.changedTouches = [e];
    }

    offset = getElementOffset(element);

    for (touchIndex = 0, l = e.changedTouches.length; touchIndex < l; touchIndex++) {
        touch = e.changedTouches[touchIndex];
        pos = {x: touch.pageX - offset.left, y: touch.pageY - offset.top };
        connections[peerId].target = pos;
        broadcast_action()
    }
}, moveThrottle);

function split() {
    connections[peerId].targetSplits += 1
    broadcast_action()
    split_player(peerId)
}

function on_key_up(event) {
    if(event.key === ' ') {
        split()
    }
}