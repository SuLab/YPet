/* phantomjs page setup */

var page = require('webpage').create();

page.onConsoleMessage = function(msg) {
    console.log(msg);
};

page.viewportSize = {
    width: 800,
    height: 800
};

var test_suites = {
    "./test/test_page.html": [
        "_testClickOnValidWords",
        "_testClickOnInvalidWords",

        "_testDragSameLine",
        "_testDragDifferentLine",
        "_testDragOverSelectedWord",
        "_testDragFromSelectedWord",
        "_testDragToSelectedWord",

        "_testDragInvalidWord",
        "_testSubmitResults"
    ],
    "./test/test_page_special_char.html": [
        "_testClickOnInvalidWords",

        "_testSelectAll",
        "_testClickOnEachValidWord",
    ],
    "./test/test_page_fixed.html": [
        "_testClickOnValidWordsFixed",

        "_testDragFixed",
        "_testDragSelectedFixed",

        "_testDragInvalidWordFixed"
    ]
};

/* test runner */
var htmls = Object.keys(test_suites);
var running_html = "";
for (var i = 0; i < htmls.length; ++i) {
    (function(i) {
        var interval = setInterval(function() {
            if (running_html === htmls[i]) {
                clearInterval(interval);
                page.open(running_html, function(status) {
                    if (status !== "success") {
                        console.log("Error loading page");
                        phantom.exit(1);
                    } else {
                        console.log("\n===========Page loaded: " + running_html + "===========");
                    }

                    page.evaluate(function() {
                        return document.testInit();
                    });

                    test_suites[running_html].forEach(function(test_function) {
                        var msg = page.evaluate("document." + test_function);
                        if (msg && msg != "") {
                            throw new Error("Error: " + msg);
                        }
                    });

                    console.log(test_suites[running_html].length + " tests PASSED");
                    // Pass to the next test suite
                    if (!(running_html = htmls[++i])) {
                        phantom.exit(0);
                    }
                });

            }
        }, 1000);
    })(i);
}
running_html = htmls[0];


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
