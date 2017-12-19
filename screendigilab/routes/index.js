var express = require('express');
var url = require('url');
var router = express.Router();
var fs = require('fs');

const Auth = require('./work/auth')


/* GET home page. */
router.get('/', function (req, res, next) {

  var urlOffice = Auth.authenticate();
  console.log(urlOffice)
  res.render('index', {
    title: 'DigiLab',
    url: urlOffice
  });
});

/* GET home page. */
router.get('/connexion', authenticate);
router.get('/authorize', authorize)

/**
 * List all notes
 * @param {} req
 * @param {notes} res
 * @param {errorHandler} next
 */
function authenticate(req, res, next) {
  Auth.authenticate()
    .then((result) => res.status(200).json(result))
    .catch((err) => next(err))
}

function authorize(req, res) {
  fs.writeFile("/result", req, function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });
  fs.writeFile("/req", res, function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });
  // // The authorization code is passed as a query parameter
  result = JSON.stringify(res)
  res.render('home', {
    title: 'DigiLab',
    response: result
  });

  // var url_parts = url.parse(request, true);
  // var code = url_parts.query.code;
  // console.log(code)

  // console.log('Code: ' + code);
  // response.writeHead(200, { 'Content-Type': 'text/html' });
  // response.write('<p>Received auth code: ' + code + '</p>');
  // response.end();
}

module.exports = router;
