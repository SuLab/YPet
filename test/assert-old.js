"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 * Copyright 2015 Eric Radman
 * Modified by Runjie Guan
 */

function assert(got, expected, error) {
    if (!deepEq(got, expected)) {
        throw new Error((error || "") + " \nExpected: " + expected + "\nGot:      " + got);
    }
}

/*
 * Copyright 2013 Serge A. Zaitsev
 * See LICENSE file for details
 */

function deepEq(a, b) {
    if ((typeof a === "undefined" ? "undefined" : _typeof(a)) !== (typeof b === "undefined" ? "undefined" : _typeof(b))) {
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

//# sourceMappingURL=assert-old.js.map