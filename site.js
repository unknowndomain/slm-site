var express = require("express");
var _ = require("underscore");

var config = require("./config.json");

var db = require("./database")(config.db.connection_string);
var swig = require('swig');

var site = express();

site.engine('swig.html', swig.renderFile);

site.set('view engine', 'swig.html');

site.use(express.logger());
site.use("/static", express.static(config.static_dir));

_.each(config.apps, function (app) {
    var module = require(app.module);
    site.use(app.route, module.app(db, site, config));
});

site.listen(config.port);
console.log("Started listening on port " + config.port);
