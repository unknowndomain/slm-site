#!/bin/env node
var express = require("express"),
    _ = require("underscore"),
    config = require("./config.json"),
    db = require("./database"),
    swig = require('swig');

process.env.TZ = config.timezone

var site = express();

site.engine('swig.html', swig.renderFile);

site.set('view engine', 'swig.html');

site.use(express.logger());

site.use(function(req, res, next) {
    if ((req.protocol === 'http') && (config.force_https)) {
        res.redirect('https://' + req.headers.host + req.url);
    }
    else {
        return next();
    }
});

site.use("/static", express.static(__dirname + "/" + config.static_dir));

site.use(express.cookieParser(config.secret));
site.use(express.session());
site.use(express.bodyParser());

site.use(function (req, res, next) {
    res.locals.email = req.session.email;
    res.locals.path = req.path;
    
    // setup for flash messages
    req.session.messages = req.session.messages || []
    res.locals.messages = req.session.messages || []
    res.locals.get_messages = function () {
        var messages_clone = _.clone(res.locals.messages);
        req.session.messages = [];
        return messages_clone;
    }
    
    res.locals.flash = function (type, title, message) {
        if (arguments.length == 1) {
            req.session.messages.push({
                "type": "info",
                "message": type
            });
        }
        else if (arguments.length == 2) {
            req.session.messages.push({
                "type": type,
                "message": title
            });
        }
        else if (arguments.length == 3) {
            req.session.messages.push({
                "type": type,
                "title": title,
                "message": message
            });
        }
    }
    next();
});

config.db.setup.url = process.env.OPENSHIFT_MONGODB_DB_URL + config.db.setup.database

site.use(db(config.db));

site.locals.nav = []

_.each(_.sortBy(config.apps, function (app) { return app.position || 0 }), function (app) {
    var module = require(app.module);
    site.use(app.route, module.app(config, db, site));
    
    // setup nav for navigation menu
    if (!module.routes) {
        site.locals.nav.push({
            route: app.route,
            name: module.title
        });
    }
    else {
        _.each(module.routes, function(route) {
            site.locals.nav.push({
                route: route.path ? app.route + route.path : null,
                name: route.name,
                click: route.click
            });
        });
    }
});

var ip = process.env.OPENSHIFT_NODEJS_IP || config.ip || "0.0.0.0";
var port = process.env.OPENSHIFT_NODEJS_PORT || config.port;

site.listen(port, ip, function() {
    console.log("Started listening on port " + port);
});
