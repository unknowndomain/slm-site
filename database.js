var Schema = require('jugglingdb').Schema;

module.exports = function (config) {
    var schema = new Schema(config.type, config.setup);

    // USER
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
        card_id: String,
        disabled: { type: Boolean, default: false }, // for when the user wants to disable their account (self)
        approved: { type: Boolean,    default: true }, // used for when an an administrator wishes to disable the account (admin)
        gc_subscription: String, // for when a GoCardless subscription has been set up
        gc_donation: String, // for when a GoCardless subscription has been set up
        last_payment: { type: Date }, // when the last payment was received
        joined: { type: Date,    default: function () { return new Date;} }, // when the account was created (not their first payment)
        last_accessed: { type: Date }, // when they last accessed the website
        last_entered: { type: Date }, // last recorded that they went in to the space
        last_updated: { type: Date } // last time any entry was updated
    });
    
    // hooks
    
    // set updated time
    User.prototype.beforeUpdate = function (next) {
        this.updated()
        next();
    };
    
    // validation
    User.validatesPresenceOf('name', 'email', "address", "uuid")
    User.validatesUniquenessOf('email', {message: 'email is not unique'});
    
    // useful functions
    // returns whether the user is an active member, e.g.: allowed in the space
    User.prototype.is_active = function () {
        var now = new Date();
        return this.provided_details() &&
            !this.disabled &&
            this.approved &&
            this.next_payment() &&
            (now <= this.next_payment());
    }
    
    User.prototype.next_payment = function () {
        // return current date plus 32 days
        // represents latest next payment must be paid by
        // could be done more intelligently
        if (this.last_payment) {
            var next_payment_by = new Date(this.last_payment.getTime());
            next_payment_by.setDate(next_payment_by.getDate()+32);
            return next_payment_by;
        }
        return null;
    }
    
    User.prototype.paid = function () {
        // Sets the last_paid value to now. Useful for when you need to say a user has paid.
        this.last_payment = new Date();
    }
    
    User.prototype.accessed = function () {
        this.last_accessed = new Date();
    }
    
    User.prototype.entered = function () {
        this.last_entered = new Date();
    }
    
    User.prototype.updated = function () {
        this.last_updated = new Date();
    }
    
    User.prototype.add_subscription = function (subscription_id) {
        this.gc_subscription = subscription_id;
    }
    
    User.prototype.cancel_subscription = function () {
        this.gc_subscription = null;
    }
    
    User.prototype.provided_details = function () {
        return this.name && this.address
    }
    
    // HISTORIC
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
    
    // validation
    HistoricEvent.validatesPresenceOf("uuid", "description", "type");
    
    // relationship
    User.hasMany(HistoricEvent,  {as: 'historic_events',  foreignKey: 'user_id'});
    
    // used for sql databases
    if (config.autoupdate) {
        schema.autoupdate();
    }
    
    return function (req, res, next) {
        res.locals.User = User;
        if (req.session.email) {
            // lookup user from email in the database
            User.findOne({where: {email: req.session.email}}, function (err, user) {
                if (!err) {
                    if (user) {
                        // if user exists: insert the user account in to the locals
                        user.accessed();
                        user.save(function(err, user) {
                            if (!err) {
                                res.locals.user = user;
                                next();
                            }
                            else {
                                next(new Error("There was an error updating the user '" + req.session.email + "' from the database: " + err));
                            }
                        });
                    }
                    else {
                        next();
                    }
                }
                else {
                    next(new Error("There was an error retrieving the user '" + req.session.email + "' from the database: " + err));
                }
            });
        }
        else {
            next();
        }
    }
}


