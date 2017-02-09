/* phantomjs page setup */

var page = require('webpage').create();

page.onConsoleMessage = function(msg) {
    console.log(msg);
};

page.viewportSize = {
    width: 800,
    height: 800
};

/* test runner */

page.open("./test/test_page.html", function(status) {
    if (status !== "success") {
        console.log("Error loading page");
        phantom.exit(1);
    } else {
        console.log("Page loaded");
    }

    page.evaluate(function() {
        return document.testInit();
    });

    var tests = [
        "testInit",
        "_testClickOnValidWords",
        "_testClickOnInvalidWords",

        "_testDragSameLine",
        "_testDragDifferentLine",
        "_testDragOverSelectedWord",
        "_testDragFromSelectedWord",
        "_testDragToSelectedWord",

        "_testDragInvalidWord",
        "_testSubmitResults"
    ];

    tests.forEach(function(test_function) {
        var msg = page.evaluate("document." + test_function);
        if (msg && msg != "") {
            throw new Error("Error: " + msg);
        }
    });

    console.log(tests.length + " tests PASSED");
    phantom.exit(0);
});

page.onError = function(msg, trace) {
    console.error("An error occured");
    console.error(JSON.stringify(trace));
    /* inject a line number into the error message raised by assert() */
    if (trace.length > 1) {
        console.log(msg.replace(/: in /,
            " in line " + (parseInt(trace[1].line) - 1) + " of "));
    } else {
        console.log("line " + (parseInt(trace[0].line) - 1) + ": " + msg);
    }
    phantom.exit(1);
};
