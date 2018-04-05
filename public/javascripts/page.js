'use strict';

const DOMAIN = 'http://mapsearchpike96.rajgs5wdu2.us-west-1.elasticbeanstalk.com';

let app = angular.module('mapApp', ['ngAnimate']);

app.controller('FormCtrl', ['$scope', '$window', ($scope, $window) => {
  let stored = localStorage.getItem('favlist');
  $scope.favlist = stored === '' || stored === null ? {} : JSON.parse(stored);

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
    $scope.showall = false;
    $scope.topnavtab = 1;
    $scope.displaydetails = false;
    $scope.tabledata = [];
  };

  $scope.submitForm = () => {
    $scope.errorlist = false;
    $scope.showall = true;
    $scope.showprogress = true;
    $scope.topnavtab = 1;
    $scope.displaydetails = false;
    $scope.tabledata = [];
    $scope.resbackup = [];
    let keyword = $('#keyword').val().split(' ').join('+');
    let category = $scope.category;
    let distance = $scope.distance === undefined || $scope.distance === '' ? 10 : $scope.distance;
    let lat, lon;
    if ($scope.from === 'here') {
      fetch('http://ip-api.com/json')
        .then(resp => resp.json())
        .then(json => {
          lat = json.lat;
          lon = json.lon;
          $scope.showprogress = false;
          $scope.apisearch(keyword, category, distance, lat, lon);
        }).catch( error => {
          $scope.showprogress = false;
          $scope.errorlist = true;
      });

    } else {
      let loc = $('#loc').val().split(' ').join('+');
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
        if (json.status === "ZERO_RESULTS" && json.results !== undefined) {
          $scope.nolist = true;
        } else {
          $scope.nolist = false;
          $scope.pagenum = 1;
          if (json.next_page_token !== undefined) {
            $scope.nextpagetoken = json.next_page_token;
            json.results.hasnextpage = true;
          }
          $scope.tabledata.push(json.results);
          for (let i = 0; i < $scope.tabledata[0].length; i++) {
            if ($scope.favlist[$scope.tabledata[0][i].place_id] !== undefined) {
              $scope.tabledata[0][i].faved = true;
            }
          }
          $scope.resbackup.table = $scope.tabledata;
          $scope.resbackup.page = 1;

          $scope.showprogress = false;
          $scope.topnavtab = 1;
        }
        setTimeout($scope.$apply(), 2000);
      }).catch( error => {
        $scope.errorlist = true;
    });
  };

  $scope.next = () => {
    if ($scope.tabledata[$scope.pagenum + 1] === undefined) {
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
          $scope.tabledata.push(json.results);
          for (let i = 0; i < $scope.tabledata[$scope.pagenum-1].length; i++) {
            if ($scope.favlist[$scope.tabledata[$scope.pagenum-1][i].place_id] !== undefined) {
              $scope.tabledata[$scope.pagenum-1][i].faved = true;
            }
          }
          $scope.resbackup.table = $scope.tabledata;
          $scope.resbackup.page = $scope.pagenum;
          $scope.$apply();
        });
    } else {
      $scope.pagenum++;
      $scope.resbackup.table = $scope.tabledata;
      $scope.resbackup.page = $scope.pagenum;
    }
  };

  $scope.prev = () => {
    $scope.pagenum--;
    $scope.resbackup.table = $scope.tabledata;
    $scope.resbackup.page = $scope.pagenum;
  };

  $scope.getdetails = (placeid, faved) => {
    $scope.displaydetails = true;
    $scope.placeid = placeid;
    $window.placeid = placeid;
    $scope.showrouteinfo = false;

    let service = new google.maps.places.PlacesService($scope.map);
    service.getDetails({placeId: placeid}, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        $scope.detailsnavtab = 1;
        $scope.detailsdata = place;
        $scope.photodata = [];
        $scope.reviewsdata = place.reviews;
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

        try {
          for (let i = 0; i < $scope.reviewsdata.length; i++) {
            $scope.reviewsdata[i].timeformatted = moment($scope.reviewsdata[i].time * 1000).format('YYYY-MM-DD HH:mm:ss');
          }
          $scope.noreview = false;
        } catch (error) {
          $scope.noreview = true;
        }

        $scope.reviewtype = 'g';
        $('#reviewtypebutton').text('Google Reviews');
        $scope.revieworder = '';
        $('#revieworderbutton').text('Default Order');

        $scope.detailsdata.faved = faved;
        $scope.lastfaved = faved;

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

  $scope.reviewtypehandler = (text) => {
    $('#reviewtypebutton').text(text);
    if (text === 'Google Reviews') {
      $scope.reviewsdata = $scope.detailsdata.reviews;
      if ($scope.reviewsdata === undefined || $scope.reviewsdata.length === 0) {
        $scope.noreview = true;
        $scope.$apply();
        return;
      }
      $scope.noreview = false;
      for (let i = 0; i < $scope.reviewsdata.length; i++) {
        $scope.reviewsdata[i].timeformatted = moment($scope.reviewsdata[i].time * 1000).format('YYYY-MM-DD HH:mm:ss');
      }
    } else {
      let addressArr = $scope.detailsdata.address_components;
      let name = $scope.detailsdata.name;
      let address1 = $scope.detailsdata.formatted_address;
      let city, state, country;
      for (let i = 0; i< addressArr.length; i++) {
        if (addressArr[i].types[0] === 'locality') {
          city = addressArr[i].short_name;
        }
        if (addressArr[i].types[0] === 'administrative_area_level_1') {
          state = addressArr[i].short_name
        }
        if (addressArr[i].types[0] === 'country') {
          country = addressArr[i].short_name;
        }
      }

      name = name.split(' ').join('+');
      address1 = address1.split(' ').join('+');
      city = city.split(' ').join('+');

      let url = DOMAIN + '/yelp?name=' + name + '&address1=' + address1
        + '&city=' + city + '&state=' + state + '&country=' + country;
      fetch(url)
        .then(resp => resp.json())
        .then(json => {
          if (json.length === 0) {
            $scope.reviewsdata = json;
            $scope.noreview = true;
            $scope.$apply();
            return;
          }
          $scope.noreview = false;
          for (let i = 0; i< json.length; i++) {
            json[i].profile_photo_url = json[i].user.image_url;
            json[i].author_url = json[i].url;
            json[i].author_name = json[i].user.name;
            json[i].timeformatted = json[i].time_created;
          }
          $scope.reviewsdata = json;
          $scope.$apply();
        }).catch( error => {
        $scope.showprogress = false;
        $scope.errorlist = true;
      });
    }
  };

  $scope.revieworderhandler = (text) => {
    $('#revieworderbutton').text(text);
  };

  $scope.twittershare = () => {
    let url = 'https://twitter.com/intent/tweet?text=';
    url += 'Check out ' + $scope.detailsdata.name + ' located at ' + $scope.detailsdata.formatted_address + '.';
    url += ' Website:&url=' + $scope.detailsdata.website;
    url += '&hashtags=TravelAndEntertainmentSearch';
    url = encodeURI(url);

    let left = (screen.width/2)-(300);
    let top = (screen.height/2)-(300);
    let hWin = $window.open(url, 'Share a link on Twitter', 'height=500,width=500,top='+top+', left='+left);
    hWin.document.close();

  };

  $scope.highlight = (placeid) => {
    if (placeid === $scope.placeid) {
      return {'background-color': '#fed98c'};
    }
  };

  $scope.favhandler = (placeid, name, address, icon) => {
    let stored = localStorage.getItem('favlist');
    $scope.favlist = stored === '' || stored === null ? {} : JSON.parse(stored);
    if ($scope.favlist[placeid] !== undefined) {
      delete $scope.favlist[placeid];
    } else {
      $scope.favlist[placeid] = {};
      $scope.favlist[placeid].name = name;
      $scope.favlist[placeid].address = address;
      $scope.favlist[placeid].icon = icon;
    }
    localStorage.setItem('favlist', JSON.stringify($scope.favlist));
    if ($scope.topnavtab === 2) {
      $scope.topnavhandler();
    }
  };

  $scope.topnavhandler = () => {
    if ($scope.topnavtab === 1) {
      if ($scope.resbackup === []) {
        $scope.nolist = true;
      } else {
        $scope.nolist = false;
        $scope.tabledata = $scope.resbackup.table;
        $scope.pagenum = $scope.resbackup.page;
      }
    } else {
      let stored = localStorage.getItem('favlist');
      $scope.favlist = stored === '' || stored === null ? {} : JSON.parse(stored);
      if (angular.equals($scope.favlist, {})) {
        $scope.nolist = true;
        return;
      } else {
        $scope.nolist = false;
      }
      $scope.tabledata = [];
      $scope.tabledata[0] = [];
      for (let key in $scope.favlist) {
        let item = {};
        item.name = $scope.favlist[key].name;
        item.vicinity = $scope.favlist[key].address;
        item.icon = $scope.favlist[key].icon;
        item.place_id = key;
        item.faved = true;
        $scope.tabledata[0].push(item);
      }
      $scope.pagenum = 1;
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
