module.exports = {
    "port": 3000,
    "title": "South London Makerspace",
    "static_dir": "./static",
    "logo": "./static/img/logo.png",
    "templates_dir": "./templates",
    "secret_key": "!!!! CHANGE ME !!!",
    "apps": {
//      "account": require("./apps/account/app.js"),
        "membership": require("./apps/membership-system/app.js"),
    }
}
