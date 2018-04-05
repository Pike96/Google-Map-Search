const express = require('express');
const router = express.Router();
const path = require('path');
const fetch = require('node-fetch');
const yelp = require('yelp-fusion');
const client = yelp.client('HE7DD95k5kmNeEy4pMPulBZEAOCB_rqZp1LKylA_rXH61HgmbNkkiupqjy7aYIlQBD05Mj7g6n0OHkGeTZi2_HQT9JKuVgk8lGS_1CxkPhzC4SJWo3nuAbzX-vvCWnYx');

const API_KEY = "AIzaSyDf2PYwxk-hPRw0ZQDIO0TamURG3zkYX38";

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../', 'views', 'page.html'));
});

router.get('/location', (req, res) => {
  fetch('https://maps.googleapis.com/maps/api/geocode/json?address=' + req.query.loc + '&key=' + API_KEY)
    .then(resp => resp.json())
    .then(json => {
      let data = {};
      data.lat = json.results[0].geometry.location.lat;
      data.lon = json.results[0].geometry.location.lng;
      res.send(data);
  });
});

router.get('/list', (req, res) => {
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
      res.send(json);
  });
});

router.get('/nextpage', (req, res) => {
  let url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken='
    + req.query.pagetoken + '&key=' + API_KEY;
  fetch(url)
    .then(resp => resp.json())
    .then(json => {
      res.send(json);
    });
});

router.get('/details', (req, res) => {
  fetch('https://maps.googleapis.com/maps/api/place/details/json?placeid=' + req.query.placeid + '&key=' + API_KEY)
    .then(resp => resp.json())
    .then(json => {
      //let data = {};
      //data.details = json;
      //data.photoref = json.result.geometry.location.lng;
      res.send(json);
  });
});

router.get('/yelp', (req, res) => {
  let name = req.query.name.split('+').join(' ');
  let address1 = req.query.address1.split('+').join(' ');
  let city = req.query.city.split('+').join(' ');
  client.businessMatch('best', {
    name: name,
    address1: address1,
    city: city,
    state: req.query.state,
    country: req.query.country
  }).then(resp => {
    if (resp.jsonBody.businesses.length === 0 ) {
      res.send(resp.jsonBody.businesses);
    } else {
      client.reviews(resp.jsonBody.businesses[0].id).then(resp => {
        res.send(resp.jsonBody.reviews);
      }).catch(e => {
        console.log(e);
      });
    }
  }).catch(e => {
    console.log(e);
  });
});

module.exports = router;
