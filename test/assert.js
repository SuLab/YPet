/*
 * Copyright 2015 Eric Radman
 */

function assert(a, b) {
    var fn = arguments.callee.caller.name;
    if (!fn)
        fn = String(arguments.callee.caller);
    if (!deepEq(a, b)) throw new Error("in " + fn + "\n" + a + " != " + b);
}

/*
 * Copyright 2013 Serge A. Zaitsev
 * See LICENSE file for details
 */

function deepEq(a, b) {
    if (typeof a !== typeof b) {
        return false;
    }
    if (a instanceof Function) {
        return a.toString() === b.toString();
    }
    if (a === b || a.valueOf() === b.valueOf()) {
        return true;
    }
    if (!(a instanceof Object)) {
        return false;
    }
    var ka = Object.keys(a);
    if (ka.length != Object.keys(b).length) {
        return false;
    }
    for (var i in b) {
        if (!b.hasOwnProperty(i)) {
            continue;
        }
        if (ka.indexOf(i) === -1) {
            return false;
        }
        if (!deepEq(a[i], b[i])) {
            return false;
        }
    }
    return true;
}
