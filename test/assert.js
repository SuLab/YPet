/*
 * Copyright 2015 Eric Radman
 * Modified by Runjie Guan
 */

function assert(got, expected, error) {
    if (!deepEq(got, expected)) {
        throw new Error(`${error || ""} 
Expected: ${expected}
Got:      ${got}`);
    }
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
