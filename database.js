var Schema = require('jugglingdb').Schema,
    crypto = require('crypto');

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
        address: { type: Schema.Text }, // users physical address
        card_id: String, // the ID of the NFC card
        card_id_hashed: String, // the MD5 hash of the card id with salt
        disabled: { type: Boolean, default: false }, // for when the user wants to disable their account (self)
        approved: { type: Boolean,    default: true }, // used for when an an administrator wishes to disable the account (admin)
        gc_subscription: String, // for when a GoCardless subscription has been set up
        gc_donation: String, // for when a GoCardless subscription has been set up
        last_payment: { type: Date }, // when the last payment was received
        membership_expires: { type: Date }, // when the last payment was received
        joined: { type: Date,    default: function () { return new Date;} }, // when the account was created (not their first payment)
        last_accessed: { type: Date }, // when they last accessed the website
        last_entered: { type: Date }, // last recorded that they went in to the space
        last_updated: { type: Date }, // last time any entry was updated
        permission: { type: Number, default: 0 } // permission level. 0 is none, 50 is admin
    });
    
    // hooks
    
    // set updated time
    User.prototype.beforeUpdate = function (next, data) {
        this.updated();
        if (data.card_id) {
            this.hash_card_id();
        }
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
            now <= this.next_payment();
    }
    
    User.prototype.next_payment = function () {
        // return current date plus 32 days
        // represents latest next payment must be paid by
        // could be done more intelligently
        if (this.membership_expires) {
            return this.membership_expires;
        }
        else if (this.last_payment) {
            var next_payment_by = new Date(this.last_payment.getTime());
            next_payment_by.setDate(next_payment_by.getDate()+32);
            return next_payment_by;
        }
        else if (this.gc_donation) {
            return new Date(2014,5,1) // 1st june for one off members
        }
        return null;
    }
    
    User.prototype.paid = function () {
        // Sets the last_paid value to now. Useful for when you need to say a user has paid.
        var now = new Date()
        if (this.last_payment < now) {
            this.last_payment = now;
        }
        
        var expires_date = new Date(now);
        expires_date.setDate(expires_date.getDate()+32);
        
        if (this.membership_expires < expires_date) {
            this.membership_expires = expires_date;
        }
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
    
    User.prototype.hash_card_id = function () {
        if (this.card_id) {
            var md5sum = crypto.createHash('md5');
            md5sum.update(config.card_id_salt);
            md5sum.update(this.card_id.toLowerCase());
            this.card_id_hashed = md5sum.digest('hex');
        }
        else {
            this.card_id_hashed = null;
        }
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


