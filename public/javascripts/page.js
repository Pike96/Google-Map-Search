'use strict';

const DOMAIN = 'http://localhost:31322';
const API_KEY = 'AIzaSyDf2PYwxk-hPRw0ZQDIO0TamURG3zkYX38';

let app = angular.module('mapApp', []);

app.controller('FormCtrl', ($scope) => {
  $scope.from = 'here';
  $scope.category = 'default';

  $scope.restabledata = [];
  $scope.hasnextpage = false;

  $scope.fromwhere = (index) => {
    return index === $scope.from;
  };

  $scope.clearhandler = () => {
    $('#keyword').val('');
    $('#category').val('default');
    $('#distance').val('');
    $('#loc').val('');
    $scope.from = 'here';
    $scope.topnavtab = 1;
    $scope.showall = false;
    $scope.restabledata = [];
  };

  $scope.submitForm = () => {
    $scope.restabledata = [];
    $scope.showall = true;
    $scope.showprogress = true;
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
          $scope.showprogress = false;
          $scope.topnavtab = 1;
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
        $scope.pagenum = 1;
        if (json.next_page_token !== undefined) {
          $scope.nextpagetoken = json.next_page_token;
          json.results.hasnextpage = true;
        }
        $scope.restabledata.push(json.results);

        $scope.showprogress = false;
        $scope.showrestable = true;
        $scope.topnavtab = 1;
        setInterval($scope.$apply(), 1000);
      });
  };

  $scope.next = () => {
    if ($scope.restabledata[$scope.pagenum + 1] !== undefined) {
      $scope.pagenum++;
      $scope.$apply();
    }
    fetch(DOMAIN + '/nextpage?pagetoken=' + $scope.nextpagetoken)
      .then(resp => resp.json())
      .then(json => {
        $scope.pagenum++;
        if (json.next_page_token !== undefined) {
          $scope.nextpagetoken = json.next_page_token;
          json.results.hasnextpage = true;
        } else {
          json.results.hasnextpage = false;
        }
        $scope.restabledata.push(json.results);
        $scope.$apply();
      });
  }

  $scope.prev = () => {
    $scope.pagenum--;
    $scope.$apply();
  }


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

