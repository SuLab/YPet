"use strict";

var html_fixture = "./test/test_page.html";
var sources = ["./test/assert-old.js"];
var tests = [function () {
    assert(2, 3, "tets");
}];

tests.push(function count_chart_elements() {
    document.getElementsByClassName('chart')[0].id = "bogus";
    assert(document.getElementsByClassName('chart').length, 1);
});

tests.push(function get_chart_div() {
    assert(document.getElementsByClassName('chart')[0].id, "chart_60eb0dc5-6b41-4ca1-94d0-1760c1f3d87b");
});

tests.push(function compare_lists() {
    assert([1, 3, 5, 3, 7], [1, 3, 5, 7]);
});

tests.push(function compare_maps() {
    assert({ 'one': 1, 'two': 2 }, { 'two': 2, 'one': 1 });
});

tests.push(function delayed_assert() {
    setTimeout(function () {
        assert(1 / 0, Infinity);
    }, 100);
});

//# sourceMappingURL=tests-old.js.map