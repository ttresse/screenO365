var express = require('express');
var url = require('url');
var router = express.Router();
var fs = require('fs');
var microsoftGraph = require("@microsoft/microsoft-graph-client");

const Auth = require('./work/auth')

var email = "thibaut.tresse@soprasteria.com";

/* GET home page. */
router.get('/connexion', authenticate);
router.get('/authorize', authorize)
router.get('/', function (req, res, next) {
  var urlOffice = Auth.authenticate();
  //actualise le href dans html
  res.render('index', {
    title: 'DigiLab',
    url: urlOffice
  });
});

function authenticate(response, request) {
}

function authorize(response, request) {
  // The authorization code is passed as a query parameter
  var url_parts = url.parse(response.url, true);
  var code = url_parts.query.code;

  //save token
  Auth.getTokenFromCode(code, response)
    .then(function (result) {
      calendar(response, request, result)
    })
    .catch(function (err) {
      console.log(err)
    })
}

function calendar(response, request, token) {

  // Create a Graph client
  var client = microsoftGraph.Client.init({
    authProvider: (done) => {
      // Just return the token
      done(null, token.token.access_token);
    }
  });
  var reunion;

  // Get the 10 events with the greatest start date
  client
    .api('/me/events')
    .header('X-AnchorMailbox', email)
    .top(1)
    .select('subject,start,end,location')
    .orderby('start/dateTime DESC')
    .get((err, res) => {
      if (err) {
        console.log('getEvents returned an error');
      } else {
        res.value.forEach(function (message) {
          reunion1 = formating(message);
        })

        request.render('home', {
          title: 'DigiLab',
          response: reunion
        });
      }
    });

}

function formating(msg) {
  var meeting = {
    sudject: msg.subject,
    start: '',
    end: '',
    location: msg.location.displayName
  }



}

module.exports = router;
