var html_fixture = "./test/test_page.html";
var sources = ["./test/assert-old.js"];
var tests = [function() {
    console.log(21);
    throw new Error("This is an error deliberately created");
    // assert(2, 3, "tets");
}];

