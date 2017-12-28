var server = require('./server');
var router = require('./router');
var authHelper = require('./authHelper');
var microsoftGraph = require("@microsoft/microsoft-graph-client");

var handle = {};
handle['/'] = home;
handle['/authorize'] = authorize;
handle['/mail'] = mail;
handle['/calendar'] = calendar;

/**
 * Start server : go to server.js
 */
server.start(router.route, handle);

/**
 * Display home page to access to the microsoft home page connexion
 * @param {*} response 
 * @param {*} request 
 */
function home(response, request) {
  console.log('Request handler \'home\' was called.');

  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write('<p>Please <a href="' + authHelper.getAuthUrl() + '">sign in</a> with your Office 365 or Outlook.com account.</p>');
  response.end();
}

var url = require('url');

function authorize(response, request) {
  console.log('Request handler \'authorize\' was called.');
  // console.log(request)
  // The authorization code is passed as a query parameter
  // console.log(request.url)

  var url_parts = url.parse(request.url, true);
  // console.log(url_parts)

  var code = url_parts.query.code;
  // console.log('Code: ' + code);
  authHelper.getTokenFromCode(code, tokenReceived, response);
}

function getUserEmail(token, callback) {
  // Create a Graph client
  var client = microsoftGraph.Client.init({
    authProvider: (done) => {
      // Just return the token
      done(null, token);
    }
  });

  // Get the Graph /Me endpoint to get user email address
  client
    .api('/me')
    .get((err, res) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, res.mail);
      }
    });
}

function tokenReceived(response, error, token) {
  if (error) {
    // console.log('Access token error: ', error.message);
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write('<p>ERROR: ' + error + '</p>');
    response.end();
  } else {
    getUserEmail(token.token.access_token, function (error, email) {
      if (error) {
        // console.log('getUserEmail returned an error: ' + error);
        response.write('<p>ERROR: ' + error + '</p>');
        response.end();
      } else if (email) {
        var cookies = ['node-tutorial-token=' + token.token.access_token + ';Max-Age=4000',
        'node-tutorial-refresh-token=' + token.token.refresh_token + ';Max-Age=4000',
        'node-tutorial-token-expires=' + token.token.expires_at.getTime() + ';Max-Age=4000',
        'node-tutorial-email=' + email + ';Max-Age=4000'];
        response.setHeader('Set-Cookie', cookies);
        response.writeHead(302, { 'Location': 'http://localhost:8000/mail' });
        response.end();
      }
    });
  }
}

function getValueFromCookie(valueName, cookie) {
  if (cookie.indexOf(valueName) !== -1) {
    var start = cookie.indexOf(valueName) + valueName.length + 1;
    var end = cookie.indexOf(';', start);
    end = end === -1 ? cookie.length : end;
    return cookie.substring(start, end);
  }
}

function getAccessToken(request, response, callback) {
  var expiration = new Date(parseFloat(getValueFromCookie('node-tutorial-token-expires', request.headers.cookie)));

  if (expiration <= new Date()) {
    // refresh token
    // console.log('TOKEN EXPIRED, REFRESHING');
    var refresh_token = getValueFromCookie('node-tutorial-refresh-token', request.headers.cookie);
    authHelper.refreshAccessToken(refresh_token, function (error, newToken) {
      if (error) {
        callback(error, null);
      } else if (newToken) {
        var cookies = ['node-tutorial-token=' + newToken.token.access_token + ';Max-Age=4000',
        'node-tutorial-refresh-token=' + newToken.token.refresh_token + ';Max-Age=4000',
        'node-tutorial-token-expires=' + newToken.token.expires_at.getTime() + ';Max-Age=4000'];
        response.setHeader('Set-Cookie', cookies);
        callback(null, newToken.token.access_token);
      }
    });
  } else {
    // Return cached token
    var access_token = getValueFromCookie('node-tutorial-token', request.headers.cookie);
    callback(null, access_token);
  }
}

function mail(response, request) {
  getAccessToken(request, response, function (error, token) {
    // console.log('Token found in cookie: ', token);
    var email = getValueFromCookie('node-tutorial-email', request.headers.cookie);
    // console.log('Email found in cookie: ', email);
    if (token) {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.write('<div><h1>Your inbox</h1></div>');

      // Create a Graph client
      var client = microsoftGraph.Client.init({
        authProvider: (done) => {
          // Just return the token
          done(null, token);
        }
      });

      // Get the 10 newest messages
      client
        .api('/me/mailfolders/inbox/messages')
        .header('X-AnchorMailbox', email)
        .top(10)
        .select('subject,from,receivedDateTime,isRead')
        .orderby('receivedDateTime DESC')
        .get((err, res) => {
          if (err) {
            // console.log('getMessages returned an error: ' + err);
            response.write('<p>ERROR: ' + err + '</p>');
            response.end();
          } else {
            // console.log('getMessages returned ' + res.value.length + ' messages.');
            response.write('<table><tr><th>From</th><th>Subject</th><th>Received</th></tr>');
            res.value.forEach(function (message) {
              // console.log('  Subject: ' + message.subject);
              var from = message.from ? message.from.emailAddress.name : 'NONE';
              response.write('<tr><td>' + from +
                '</td><td>' + (message.isRead ? '' : '<b>') + message.subject + (message.isRead ? '' : '</b>') +
                '</td><td>' + message.receivedDateTime.toString() + '</td></tr>');
            });

            response.write('</table>');
            response.end();
          }
        });
    } else {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.write('<p> No token found in cookie!</p>');
      response.end();
    }
  });
}

function calendar(response, request) {
  // getAccessToken(request, response, function (error, token) {
  //   var email = getValueFromCookie('node-tutorial-email', request.headers.cookie);

  //   if (token) {
  //     console.log(token)
  //     // Create a Graph client
  //     var client = microsoftGraph.Client.init({
  //       authProvider: (done) => {
  //         // Just return the token
  //         done(null, token);
  //       }
  //     });

  //     var reunion = [];

  //     client
  //       .api('/me/events')
  //       .header('X-AnchorMailbox', email)
  //       .top(15)
  //       .select('subject,start,end,location,attendees,organizer')
  //       .orderby('start/dateTime DESC')
  //       .get((err, res) => {
  //         if (err) {
  //           console.log('getEvents returned an error');
  //         } else {
  //           res.value.forEach(function (message) {
  //             if (formatingDay(message.start.dateTime, message.end.dateTime)) {

  //               var debut = getHourAndMinutes(message.start.dateTime);
  //               var end = getHourAndMinutes(message.end.dateTime);

  //               reunion.push({
  //                 session: message.subject,
  //                 dateDebut: message.start.dateTime,
  //                 heureDebut: debut.heure,
  //                 minuteDebut: debut.minute,
  //                 dateFin: message.end.dateTime,
  //                 heureFin: end.heure,
  //                 minuteFin: end.minute,
  //                 organisateur: message.organizer.emailAddress.name
  //               });
  //             }
  //           })

  //           var dailyPlanning = handleDailyMeeting(reunion);
  //           request.render('home', {
  //             title: 'DigiLab',
  //             response: dailyPlanning
  //           });
  //         }
  //       });
  //   }
  // });
}