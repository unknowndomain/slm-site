
describe('Database', function(){
    var db = require("../database")({type: "memory"});
    describe('get no user', function(){
        it('should not error', function(){
            db({"session": {}}, {"locals": {}}, function() {});
        })
    })
    describe('create user', function(){
        it('should not error', function(){
            var res = {"locals": {}}
            db({"session": {}}, res, function() {});
            res.locals.User.create({
                "email": "test@example.com",
                "name": "Test User",
                "address": "example address"
            }, function (err, user) {
                if (err) {
                    throw(err);
                }
            });
        })
    });
    describe('get user', function(){
        var res = {"locals": {}}
        db({"session": {}}, res, function() {});
        res.locals.User.create({
            "email": "test2@example.com",
            "name": "Test User",
            "address": "example address"
        }, function (err, user) {
            if (err) {
                throw(err);
            }
        });
        it('should have no history', function () {
            res.locals.User.findOne({where: {email: "test2@example.com"}}, function(err,user) {
                if (!err) {
                    user.historic_events(function(i) {
                        // assert null
                    });
                }
                else {
                    throw (err);
                }
            });
        });
        it('should have no trouble creating history', function () {
            res.locals.User.findOne({where: {email: "test2@example.com"}}, function(err,user) {
                if (!err) {
                    user.historic_events.create({
                        description: 'description',
                        value: 123,
                        type: 'hello'
                    }, function (err, event) {
                        if (err) {
                            throw (err)
                        }
                    });
                }
                else {
                    throw (err);
                }
            });
        });
        it('should have history', function () {
            res.locals.User.findOne({where: {email: "test2@example.com"}}, function(err,user) {
                if (!err) {
                    user.historic_events(function(err, e) {
                        console.log("''''''", e);
                    });
                }
                else {
                    throw (err);
                }
            });
        });
    })
})
