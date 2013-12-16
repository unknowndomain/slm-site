var Schema = require('jugglingdb').Schema;

module.exports = function (connection_string) {
    var schema = new Schema(connection_string); //port number depends on your configuration

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
        approved: { type: Date,    default: true }, // used if the user should not be approved
        active: { type: Date,    default: false }, // for use for when their payment hasn't come through
        joined: { type: Date,    default: function () { return new Date;} }
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

    return {
        User: User
    }
}


