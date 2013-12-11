var express = require("express");
var _ = require("underscore");

var config = require("./config.json");

var site = express();
site.use(express.logger());
site.use(config.static_dir, express.static("."));

_.each(config.apps, function (app) {
    var module = require(app.module);
    site.use(app.route, module.app());
});

site.listen(config.port);
console.log("Started listening on port " + config.port);
