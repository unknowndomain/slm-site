var express = require("express");
var _ = require("underscore");

var config = require("./config.json");

var db = require("./database")(config.db.connection_string);
var jinja = require("jinja");

var site = express();

app.engine('html', swig.renderFile);

app.set('view engine', '.jinja.html');
app.set('views', './templates');

site.use(express.logger());
site.use("/static", express.static(config.static_dir));

_.each(config.apps, function (app) {
    var module = require(app.module);
    site.use(app.route, module.app(db, site, config));
});

site.listen(config.port);
console.log("Started listening on port " + config.port);
