var Schema = require('jugglingdb').Schema;

module.exports = function (config) {
    var schema = new Schema(config.connection_string); //port number depends on your configuration

    // simplier way to describe model
    var User = schema.define('User', {
        name: String,
        uuid: {
            type: String ,
            default: function () { // pseudo uuid4
                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
                };
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
            }
        },
        email: String,
        address: { type: Schema.Text },
        disabled: { type: Boolean, default: false }, // for when the user wants to disable their account (self)
        approved: { type: Boolean,    default: true }, // used for when an an administrator wishes to disable the account (admin)
        member: { type: Boolean,    default: false }, // for use when their payments have been received (computer)
        joined: { type: Date,    default: function () { return new Date;} }, // when the account was created (not their first payment)
        last_logged_in: { type: Date }, // when they last signed in to the website
        last_entered: { type: Date }, // last recorded that they went on site
        last_updated: { type: Date } // last time any entry was updated
    });
    
    User.validatesPresenceOf('name', 'email', "address", "uuid")
    User.validatesUniquenessOf('email', {message: 'email is not unique'});
    
    User.prototype.is_active = function () {
        return this.approved && this.active;
    }
    
    var HistoricEvent = schema.define('HistoricEvent', {
        uuid: {
            type: String ,
            default: function () { // pseudo uuid4
                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
                };
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
            }
        },
        description: Schema.Text,
        created: { type: Date,    default: function () { return new Date;} },
        type: { type: String, default: "unknown" },
        renumeration: { type: Number, default: null } // if not null then renumeration occured. If less than 0 (negative) then money was donated to the space, if greater than 0 (positive) then money was handed back to the user.
    });
    
    HistoricEvent.validatesPresenceOf("uuid", "description", "type");
    
    User.hasMany(HistoricEvent,  {as: 'historic_events',  foreignKey: 'user_id'});

    return function (req, res, next) {
        if (req.session.email) {
            // lookup user from email in the database
            User.findOne({where: {email: req.session.email}}, function (err, user) {
                if (!err) {
                    if (user) {
                        // if user exists: insert the user account in to the locals
                        res.locals.user = user;
                    }
                }
                console.log("There was an error retrieving the user '" + req.session.email + "' from the database: " + err);
            });
        }
        next();
    }
}


