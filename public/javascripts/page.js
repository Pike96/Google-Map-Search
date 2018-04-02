'use strict';

const DOMAIN = 'http://localhost:31322';
const API_KEY = 'AIzaSyDf2PYwxk-hPRw0ZQDIO0TamURG3zkYX38';

let app = angular.module('mapApp', ['ngAnimate']);

app.controller('FormCtrl', ['$scope', '$window', ($scope, $window) => {
  $scope.map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -33.866, lng: 151.196},
    zoom: 15
  });
  $scope.directionsService = new google.maps.DirectionsService;
  $scope.directionsDisplay = new google.maps.DirectionsRenderer({
    map: $scope.map,
    panel: document.getElementById('routeinfo')
  });

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
    $scope.displaydetails = false;
    $scope.restabledata = [];
  };

  $scope.submitForm = () => {
    $scope.errorlist = false;
    $scope.restabledata = [];
    $scope.showall = true;
    $scope.showprogress = true;
    $scope.displaydetails = false;
    let keyword = $('#keyword').val().split(' ').join('+');
    let category = $scope.category;
    let distance = $scope.distance === undefined || $scope.distance === '' ? 10 : $scope.distance;
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
        }).catch( error => {
          $scope.showprogress = false;
          $scope.errorlist = true;
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
        }).catch( error => {
          $scope.showprogress = false;
          $scope.errorlist = true;
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
        $scope.topnavtab = 1;
        if (json.status === "ZERO_RESULTS" && json.results !== undefined) {
          $scope.nolist = true;
        } else {
          $scope.nolist = false;
        }
        setTimeout($scope.$apply(), 2000);
      }).catch( error => {
        $scope.errorlist = true;
    });
  };

  $scope.next = () => {
    if ($scope.restabledata[$scope.pagenum + 1] === undefined) {
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
    } else {
      $scope.pagenum++;
    }
  };

  $scope.prev = () => {
    $scope.pagenum--;
  };

  $scope.getdetails = (placeid) => {
    $scope.displaydetails = true;
    $scope.placeid = placeid;
    $window.placeid = placeid;
    $scope.showrouteinfo = false;

    let service = new google.maps.places.PlacesService($scope.map);
    service.getDetails({placeId: placeid}, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        $scope.detailsdata = place;
        $scope.photodata = [];
        if (place.photos === undefined || place.photos.length === 0) {
          $scope.nophoto = true;
        } else {
          $scope.nophoto = false;
          for (let i = 0; i < place.photos.length; i++) {
            $scope.photodata.push(place.photos[i].getUrl({'maxWidth': 2000}));
          }
        }
        if ($scope.detailsdata.price_level !== undefined) {
          $scope.detailsdata.price_level = Array($scope.detailsdata.price_level + 1).join('$');
        }
        if ($scope.detailsdata.opening_hours !== undefined) {
          let str = '';
          let d = new Date();
          let i = d.getDay();
          if (i === 0){
            i = 6;
          } else {
            i--;
          }
          $scope.todayindex = i;
          if ($scope.detailsdata.opening_hours.open_now) {
            str = $scope.detailsdata.opening_hours.weekday_text[i];
            str = str.replace(/.*day/g, 'Open now');
          } else {
            str = 'Closed';
          }
          $scope.detailsdata.todayhrs = str;
        }

        // Map
        let pos = {lat: place.geometry.location.lat(), lng: place.geometry.location.lng()};
        $scope.map = new google.maps.Map(document.getElementById('map'), {
          center: pos,
          zoom: 15
        });
        $scope.marker = new google.maps.Marker({
          position: {lat: place.geometry.location.lat(), lng: place.geometry.location.lng()},
          map: $scope.map,
          title: 'Hello World!'
        });
        $scope.panorama = $scope.map.getStreetView();
        $scope.panorama.setPosition(pos);
        $scope.panorama.setPov(/** @type {google.maps.StreetViewPov} */({
          heading: 265,
          pitch: 0
        }));

        $scope.mapto = $scope.detailsdata.name + ', ' + $scope.detailsdata.formatted_address;

        let autocomplete = new google.maps.places.Autocomplete(
          (document.getElementById('mapfrom')),
          {types: ['geocode']});
        google.maps.event.addListener(autocomplete, 'place_changed', function () {});

        $scope.$apply();
      }
    });
  };

  $scope.directionsbuttonhandler = () => {
    let maplat, maplon;
    if ($('#mapfrom').val() === 'Your location'
      || $('#mapfrom').val() === 'My location'
      || $('#mapfrom').val() === 'My Location') {
      fetch('http://ip-api.com/json')
        .then(resp => resp.json())
        .then(json => {
          maplat = json.lat;
          maplon = json.lon;
          $scope.getdirections(maplat, maplon);
        }).catch( error => {
        $scope.errordetails = true;
      });
    } else {
      let mapfrom = $('#mapfrom').val().split(' ').join('+');
      fetch(DOMAIN + '/location?loc=' + mapfrom)
        .then(resp => resp.json())
        .then(json => {
          maplat = json.lat;
          maplon = json.lon;
          $scope.getdirections(maplat, maplon);
        }).catch( error => {
        $scope.errordetails = true;
      });
    }
  };

  $scope.getdirections = (maplat, maplon) => {
    $scope.directionsDisplay.setMap($scope.map);
    $scope.marker.setMap(null);
    let start = {lat: maplat, lng: maplon};
    $scope.directionsService.route({
      origin: start,
      destination: {lat: $scope.detailsdata.geometry.location.lat(), lng: $scope.detailsdata.geometry.location.lng()},
      travelMode: google.maps.TravelMode[$scope.travelmode],
      provideRouteAlternatives: true
    }, function(response, status) {
      if (status === 'OK') {
        $scope.directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
      $scope.showrouteinfo = true;
      $scope.$apply();
    });
  };

  $scope.panohandler = () => {
    let toggle = $scope.panorama.getVisible();
    if (toggle === false) {
      $scope.panostate = true;
      $scope.panorama.setVisible(true);
    } else {
      $scope.panostate = false;
      $scope.panorama.setVisible(false);
    }
  };
}]);

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
  try {
    let autocomplete = new google.maps.places.Autocomplete(
      (document.getElementById('loc')),
      {types: ['geocode']});
    google.maps.event.addListener(autocomplete, 'place_changed', function () {});
  } catch (e) {}
});
