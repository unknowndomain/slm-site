var Schema = require('jugglingdb').Schema;

module.exports = function (connection_string) {
    var schema = new Schema(connection_string); //port number depends on your configuration

    // simplier way to describe model
    var User = schema.define('User', {
        name: String,
        email: String,
        enabled: { type: Date,    default: true }, // used if the user should not be approved
        approved: { type: Date,    default: false },
        joined: { type: Date,    default: function () { return new Date;} }
    });
    
    User.validatesPresenceOf('name', 'email')
    User.validatesUniquenessOf('email', {message: 'email is not unique'});
    
    User.prototype.is_approved = function () {
        return this.enabled && this.approved;
    }

    return {
        User: User
    }
}


