'use strict';

var app = angular.module('mapApp', []);

app.controller('FormCtrl', function ($scope) {
  $('#search').prop('disabled', true);
  $scope.from = 'here';
  $scope.category = 'default';

  $scope.checkForm = function () {

  };

  $scope.fromwhere = function(index) {
    return index === $scope.from;
  };

  $scope.submitForm = function () {

  }
  // $scope.radiohandler = function () {
  //   if ($('input:checked').val() === "here") {
  //     document.getElementById("loc").required = false;
  //     document.getElementById("loc").disabled = true;
  //   } else {
  //     document.getElementById("loc").required = true;
  //     document.getElementById("loc").disabled = false;
  //   }
  // };
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
    // document.getElementById("test").addEventListener('click', function(event) {
    //
    // }, false);

    // document.addEventListener('keyup', function(event) {
    //   if (form.checkValidity() === false) {
    //     $('#search').prop('disabled', true);
    //   } else {
    //     $('#search').prop('disabled', false);
    //   }
    // });

  }, false);
})();

