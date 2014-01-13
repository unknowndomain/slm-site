# South London Makerspace Membership Management Service

This is a webservice that allows users to become members of the South London Makerspace and manage their membership.

The aim was to make it modular so that other spaces can fork it and make use of it for their own meals and share the code with other spaces.

This part of the service in particular is a loader of modules and apps that can be used more widely with few changes.nd se

## Setup
Setup is pretty straight forward. Clone the repo then use the following command to download all of the submodules that contain the apps.

    git submodule init 
    git submodule update
    
Then run:
    node server.js

### Configuration
Configure the service using the `config.json` file. A quick explanation of the options:

    "port": 8080,                           # port to run the webserver on
    "title": "South London Makerspace",     # title of your web service
    "static_dir": "./static",               # the directory on the filesystem where your static files are kept
    "logo": "./static/img/logo.png",        # the location of the logo file for the web page
    "templates_dir": "./templates",         # the directory where the templates are kept
    "secret": "!!!! CHANGE ME !!!!",        # the salt to hash the session cookies with. Don't use this for any other secret key.
    "force_https": false,                   # BUGGY: redirect the connection to a HTTPS page
    "timezone": "Europe/London",            # The servers timezone might not be the one you need. You can set it manually here.
    "db": {
        "type": "memory",                   # type of JugglingDB database https://github.com/1602/jugglingdb#jugglingdb-adapters don't forget to install it
        "setup": {                          # options for that type of database
        },
        "autoupdate": true                  # jugglingdb option to prevent the over-writing of values
    },
    "gocardless": {                         # options specific to gocardless: might be better suited to being in the app
        "appId": "DUMMY_APP",
        "appSecret": "INSERT_APP_SECRET_HERE",
        "token": "INSERT_MERCHANT_ACCESS_TOKEN",
        "merchantId": "INSERT_MERCHANT_ID",
        "secretKey": "----CHANGE-ME ----",  # the end part of the url path the webhook posts to. Sort of like a private key. Don't use this for any other secret key.
        "sandbox": true,                    # whether gocardless works in sandbox mode
        "paidWhen": "withdrawn"             # either 'withdrawn' or 'paid' as to whether the membership is valid
    },
    "apps": [                               # array of apps to load
        {
            "route": "/",                   # where the app should be loaded in it
            "module": "./apps/slm-frontpage/app.js" # the location of the app file
        },
        {
            "route": "/auth",               # where the app should be loaded in it
            "module": "./apps/slm-persona/app.js",  # the location of the app file
            "position": 100                 # where the app is positioned in the navigation
        },
        
    ],
    "audience": "http://localhost:8080/"    # used by persona to authenticate the server https://npmjs.org/package/express-persona

### OpenShift
This webservice is built to work with although doesn't require OpenShift -- a free PaaS service from Red Hat. OpenShift uses Git to load the app, once you create the app with Node and your preferred database in use these instructions to load it in to the server:
    git remote add openshift -f <openshift-git-repo-url>
    git merge openshift/master -s recursive -X ours
    git push openshift HEAD
    
Don't forget to push again when you want to try it out and push back to your github fork if you want to save it.

## License

    South London Makerspace Membership Management Service
    Copyright (C) 2014  Matt Copperwaite

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
