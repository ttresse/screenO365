var express = require('express');
var url = require('url');
var router = express.Router();
var fs = require('fs');
var microsoftGraph = require("@microsoft/microsoft-graph-client");

const Auth = require('./work/auth')

var email = "thibaut.tresse@soprasteria.com";

/* GET home page. */
router.get('/authorize', authorize)
router.get('/calendar', calendar)
router.get('/', function (req, res, next) {
  var urlOffice = Auth.authenticate();
  //actualise le href dans html
  res.render('index', {
    title: 'DigiLab',
    url: urlOffice
  });
});



function authorize(response, request) {
  // The authorization code is passed as a query parameter
  var url_parts = url.parse(response.url, true);
  var code = url_parts.query.code;
  //save token
  Auth.getTokenFromCode(code, response)
    .then(function (result) {
      
      calendar(request, result)
    })
    .catch(function (err) {
      console.log(err)
    })

}


/**
 * Get Outlook Calendar Info and send it to the HTML file
 * @param {*} response 
 * @param {*} request 
 * @param {*} token 
 */
function calendar(request, token) {

  // Create a Graph client
  var client = microsoftGraph.Client.init({
    authProvider: (done) => {
      // Just return the token
      done(null, token.token.access_token);
    }
  });
  var reunion = [];
  // Get the 10 events with the greatest start date
  client
    .api('/me/events')
    .header('X-AnchorMailbox', email)
    .top(15)
    .select('subject,start,end,location,attendees,organizer')
    .orderby('start/dateTime DESC')
    .get((err, res) => {
      if (err) {
        console.log('getEvents returned an error');
      } else {
        res.value.forEach(function (message) {
          if (formatingDay(message.start.dateTime, message.end.dateTime)) {

            var debut = getHourAndMinutes(message.start.dateTime);
            var end = getHourAndMinutes(message.end.dateTime);

            reunion.push({
              session: message.subject,
              dateDebut: message.start.dateTime,
              heureDebut: debut.heure,
              minuteDebut: debut.minute,
              dateFin: message.end.dateTime,
              heureFin: end.heure,
              minuteFin: end.minute,
              organisateur: message.organizer.emailAddress.name
            });
          }
        })

        var dailyPlanning = handleDailyMeeting(reunion);
        console.log(request.query)
        request.render('home', {
          title: 'DigiLab',
          response: dailyPlanning
        });
      }
    });

}

/**
 * Sort Daily calendar Meeting and form the object to send
 * @param {*} reunion 
 */
function handleDailyMeeting(reunion) {
  var planning = {
    session: 'Pas de session en ce moment',
    heureDebut: '--:--',
    heureFin: '--:--',
    organisateur: '',
    nextsession: " Pas de prochaine session aujourd'hui",
    test: false,
    hoursPlanning: []
  };
  var day = new Date();
  var currentHour = {};
  var compteur = 0;

  currentHour = getHourAndMinutes(day);

  reunion.sort(function (a, b) {
    return a["heureDebut"] - b["heureDebut"] || a["minuteDebut"] - b["minuteDebut"];
  });

  var thisMorning = new Date();
  thisMorning.setHours(08);
  thisMorning.setMinutes(00);
  thisMorning.setSeconds(0);
  thisMorning.setMilliseconds(0);

  for (i = 0; i < 52; i++) {

    reunion.forEach(function (item, index) {
      var Debut = new Date(item.dateDebut);
      var Fin = new Date(item.dateFin);
      // console.log(Debut)
      // console.log(thisMorning)
      // console.log(Fin)
      if (Debut <= thisMorning && Fin > thisMorning) {
        planning.hoursPlanning[i] = true;
      }
    })

    thisMorning = addMinutes(thisMorning, 15)
  }

  // console.log(planning.hoursPlanning)

  reunion.forEach(function (item, index) {
    var Debut = new Date(item.dateDebut);
    var Fin = new Date(item.dateFin);

    if (Debut <= day && Fin >= day) {
      planning.session = item.session;
      planning.heureDebut = item.heureDebut + ":" + item.minuteDebut;
      planning.heureFin = item.heureFin + ":" + item.minuteFin;
      planning.organisateur = item.organisateur;
      if (reunion[index + 1]) {
        planning.nextsession = " " + reunion[index + 1].session + " à " + reunion[index + 1].heureDebut + ":" + reunion[index + 1].minuteDebut;
      }
      compteur++;
      return;
    }
  })

  if (compteur === 0) {
    for (i = 0; i < reunion.length; i++) {
      var Debut = new Date(reunion[i].dateDebut);
      if (Debut > day) {
        planning.nextsession = " " + reunion[i].session + " à " + reunion[i].heureDebut + ":" + reunion[i].minuteDebut;
        break;
      }
    }
  }
  return planning;
}

/**
 * Add minute to date vanilla mode
 * @param {*} date 
 * @param {*} minutes 
 */
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Return HH:MM for a dateTime
 * @param {*} date 
 */
function getHourAndMinutes(date) {
  var tmp = new Date(date);

  var heure = tmp.getHours();
  var minute = tmp.getMinutes();

  var heureLength = (new String(heure)).length;
  var minuteLength = (new String(minute)).length;

  if (heureLength < 2) {
    heure = "0" + heure;
  }
  if (minuteLength < 2) {
    minute = "0" + minute;
  }

  return { heure, minute }
}

/**
 * Formating day from outlook calendar according to standard
 * @param {*} startTime 
 * @param {*} endTime 
 */
function formatingDay(startTime, endTime) {
  var bolean = false;
  var startTmp = new Date(startTime);
  var endTmp = new Date(endTime);
  var day = new Date();

  if ((startTmp.getFullYear() <= day.getFullYear() && startTmp.getMonth() <= day.getMonth() && startTmp.getDate() <= day.getDate())
    && (endTmp.getFullYear() >= day.getFullYear() && endTmp.getMonth() >= day.getMonth() && endTmp.getDate() >= day.getDate())) {
    bolean = true;
  }

  return bolean
}

module.exports = router;
