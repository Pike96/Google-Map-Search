'use strict';

const DOMAIN = 'http://localhost:31322';
const API_KEY = 'AIzaSyDf2PYwxk-hPRw0ZQDIO0TamURG3zkYX38';

let app = angular.module('mapApp', []);

app.controller('FormCtrl', ($scope) => {
  $('#search').prop('disabled', true);
  $scope.from = 'here';
  $scope.category = 'default';
  $scope.apikey = API_KEY;

  $scope.fromwhere = (index) => {
    return index === $scope.from;
  };

  $scope.clearhandler = () => {
    $('#keyword').val('');
    $('#category').val('default');
    $('#distance').val('');
    $('#loc').val('');
    $scope.from = 'here';
  };

  $scope.submitForm = () => {
    let keyword = $('#keyword').val().split(' ').join('+');
    let category = $scope.category;
    let distance = $scope.distance === undefined ? 10 : $scope.distance;
    let lat, lon;
    console.log($scope.from);
    if ($scope.from === 'here') {
      fetch('http://ip-api.com/json')
        .then(resp => resp.json())
        .then(json => {
          lat = json.lat;
          lon = json.lon;
          $scope.apisearch(keyword, category, distance, lat, lon);
        });

    } else {
      let loc = $('#loc').val().split(' ').join('+');
      console.log(loc);
      fetch(DOMAIN + '/location?loc=' + loc)
        .then(resp => resp.json())
        .then(json => {
          lat = json.lat;
          lon = json.lon;
          $scope.apisearch(keyword, category, distance, lat, lon);
        });
    }
  };

  $scope.apisearch = (keyword, category, distance, lat, lon) => {
    fetch(DOMAIN + '/list?keyword=' + keyword + '&category=' + category
      + '&distance=' + distance + '&lat=' + lat + '&lon=' + lon)
      .then(resp => resp.json())
      .then(json => {
        console.log(json);
      });
  };

});

// onload
$(window).on('load', () => {

  // Validate
  let form = $('#myForm')[0];
  $('body').click((event) => {
    // !! Prevent click on the input. May fail to change the checked radio button
    if ($(event.target).is('input') || $(event.target).is('label')) {
      return;
    }
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }
    form.classList.add('was-validated');
  });

  // Autocomplete
  let autocomplete = new google.maps.places.Autocomplete(
    (document.getElementById('loc')),
    {types: ['geocode']});
  google.maps.event.addListener(autocomplete, 'place_changed', function () {
  });

});

