var express = require("express");
var _ = require("underscore");

var config = require("./config.json");

var site = express();
site.use(express.logger());
site.use(config.static_dir, express.static("."));

// load each app in to the site HAS to be a better way
_.each(config.apps, function (app, location) {
    var app_routes = app.app().routes;
    _.each(app_routes.get, function (route) {
        site.get("/" + location + route.path, route.callbacks)
    });
});

site.listen(config.port);
console.log("Started listening on port " + config.port);
