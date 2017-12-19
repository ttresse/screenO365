'use strict'


var credentials = {
    client: {
        id: '10c1dfa6-b7c1-4b36-9fbf-a8699fa4c5c1',
        secret: 'chxNGK643|hpmiIFLR90]_!',
    },
    auth: {
        tokenHost: 'https://login.microsoftonline.com',
        authorizePath: 'common/oauth2/v2.0/authorize',
        tokenPath: 'common/oauth2/v2.0/token'
    }
};

// The scopes the app requires
var scopes = ['openid',
    'offline_access',
    'User.Read',
    'Mail.Read',
    'Calendars.Read'];

///////
module.exports = {
    authenticate: authenticate
}

var oauth2 = require('simple-oauth2').create(credentials);
var redirectUri = 'http://localhost:8000/authorize';

/**
 * fonction authenticated
 */
function authenticate() {
    var returnVal = oauth2.authorizationCode.authorizeURL({
        scope: scopes.join(' ')
    });
    return returnVal;
}




