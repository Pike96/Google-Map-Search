const express = require('express');
const router = express.Router();
const path = require('path');
const fetch = require('node-fetch');

const API_KEY = "AIzaSyDf2PYwxk-hPRw0ZQDIO0TamURG3zkYX38";

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'page.html'));
});

router.get('/location', function (req, res) {
  fetch('https://maps.googleapis.com/maps/api/geocode/json?address=' + req.query.loc + '&key=' + API_KEY)
    .then(resp => resp.json())
    .then(json => {
      let data = {};
      data.lat = json.results[0].geometry.location.lat;
      data.lon = json.results[0].geometry.location.lng;
      res.send(data);
  });
});

router.get('/list', function (req, res) {
  let radius = req.query.distance * 1609.34;
  let url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?radius=' + radius
    + '&location=' + req.query.lat + ',' + req.query.lon
    + '&type=' + req.query.category + '&keyword=' + req.query.keyword + '&key=' + API_KEY;
  if (req.query.pagetoken !== undefined) {
    url += req.query.pagetoken;
  }
  fetch(url)
    .then(resp => resp.json())
    .then(json => {
      console.log(url);
      res.send(json);
  });
});

router.get('/nextpage', function (req, res) {
  let url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken='
    + req.query.pagetoken + '&key=' + API_KEY;
  fetch(url)
    .then(resp => resp.json())
    .then(json => {
      console.log(url);
      res.send(json);
    });
});

router.get('/details', function (req, res) {
  fetch('https://maps.googleapis.com/maps/api/place/details/json?placeid=' + req.query.placeid + '&key=' + API_KEY)
    .then(resp => resp.json())
    .then(json => {
      //let data = {};
      //data.details = json;
      //data.photoref = json.result.geometry.location.lng;
      res.send(json);
  });
});

module.exports = router;
