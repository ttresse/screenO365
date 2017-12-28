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

var oauth2 = require('simple-oauth2').create(credentials);

var token;

/**
 * fonction authenticated
 */
function authenticate() {
    var returnVal = oauth2.authorizationCode.authorizeURL({
        scope: scopes.join(' ')
    });
    return returnVal;
}

/**
 * get token from code
 */
function getTokenFromCode(code, response) {
    return new Promise(function (resolve, reject) {
        oauth2.authorizationCode.getToken({
            code: code,
            scope: scopes.join(' ')
        })
            .then(function (result) {
                token = oauth2.accessToken.create(result);
                return resolve(token)
            })
            .catch(function (err) {
                return reject(err)
            })
    })
}

/**
 * Refresh the token access
 * @param {*} refreshToken 
 * @param {*} callback 
 */
function refreshAccessToken(refreshToken, callback) {
    var tokenObj = oauth2.accessToken.create({ refresh_token: refreshToken });
    tokenObj.refresh(callback);
}

///////
module.exports = {
    authenticate: authenticate,
    getTokenFromCode: getTokenFromCode,
    refreshAccessToken: refreshAccessToken
}


