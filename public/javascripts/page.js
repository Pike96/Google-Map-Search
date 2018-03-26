'use strict';

var app = angular.module('mapApp', []);

app.controller('FormCtrl', function ($scope) {
  $('#search').prop('disabled', true);
  $scope.from = 'here';
  $scope.category = 'default';

  $scope.fromwhere = function(index) {
    return index === $scope.from;
  };

  $scope.submitForm = function () {

  }

});

(function() {
  // onload
  window.addEventListener('load', function() {
    var form = $('#myForm')[0];
    $('body').click(function(event) {
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

    var autocompleteKeyword = new google.maps.places.Autocomplete(
      (document.getElementsByClassName('autocomplete')[0]),
      {types: ['geocode']});
    google.maps.event.addListener(autocompleteKeyword, 'place_changed', function () {});

    var autocompleteLoc = new google.maps.places.Autocomplete(
      (document.getElementsByClassName('autocomplete')[1]),
      {types: ['geocode']});
    google.maps.event.addListener(autocompleteLoc, 'place_changed', function () {});

  }, false);
})();

