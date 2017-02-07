/*
 * Copyright (c) 2015 Eric Radman <ericshane@eradman.com>
 * 
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

/* phantomjs page setup */

var page = require('webpage').create();

page.onConsoleMessage = function(msg) {
    console.log(msg);
};

/* read html_fixture, sources[], tests[] */
phantom.injectJs('./test/tests-old.js');

/* test runner */

page.open(html_fixture, function(status) {
    if (status !== "success") {
        console.log("Error loading page");
        phantom.exit(1);
    }
    var _content = page.content;
    /* iterate over the tests, resetting page content each time */
    tests.forEach(function(test_function) {
        page.content = _content;
        /* activate javascript on the refreshed page */
        sources.forEach(function(file) {
            if (!page.injectJs(file)) {
                throw new Error("Unable to load '" + file + "'");
            }
        });
        /* execute test in the page context */
        page.evaluate(test_function);
    });
    /* pause to allow tests with timers to complete */
    setTimeout(function() {
        console.log(tests.length + " tests PASSED");
        phantom.exit(0);
    }, 200);
    console.log(Array(tests.length + 1).join('.'));
});

page.onError = function(msg, trace) {
    console.error("An error occured");
    /* inject a line number into the error message raised by assert() */
    if (trace.length > 1) {
        console.log(msg.replace(/: in /,
            " in line " + (parseInt(trace[1].line) - 1) + " of "));
    } else {
        console.log("line " + (parseInt(trace[0].line) - 1) + ": " + msg);
    }
    phantom.exit(1);
};
