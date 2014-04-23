'use strict';

var rcMod = angular.module('rcApp');

// Numbers : Incoming : List ---------------------------------------------------

rcMod.controller('NumbersCtrl', function ($scope, $resource, $modal, $dialog, $rootScope, $anchorScroll, SessionService, RCommNumbers) {
  $anchorScroll(); // scroll to top
  $scope.sid = SessionService.get("sid");

  // edit incoming number friendly name --------------------------------------
  $scope.editingFriendlyName = "";

  $scope.setFriendlyName = function(pn) {
    var params = {PhoneNumber: pn.phone_number, FriendlyName: pn.friendly_name};

    RCommNumbers.update({accountSid:$scope.sid, phoneSid:pn.sid}, $.param(params),
      function() { // success
        $scope.editingFriendlyName = "";
      },
      function() { // error
        // TODO: Show alert
      }
    );
  }

  // add incoming number -----------------------------------------------------

  $scope.showRegisterIncomingNumberModal = function () {
    var registerIncomingNumberModal = $modal.open({
      controller: NumberDetailsCtrl,
      scope: $scope,
      templateUrl: 'modules/modals/modal-register-incoming-number.html'
    });

    registerIncomingNumberModal.result.then(
      function () {
        // what to do on modal completion...
        $scope.numbersList = RCommNumbers.query({accountSid:$scope.sid});
      },
      function () {
        // what to do on modal dismiss...
      }
    );
  };

  // delete incoming number --------------------------------------------------

  $scope.confirmNumberDelete = function(phone) {
    confirmNumberDelete(phone, $dialog, $scope, RCommNumbers);
  }

  $scope.numbersList = RCommNumbers.query({accountSid: $scope.sid});
});

// Numbers : Incoming : Details (also used for Modal) --------------------------

var NumberDetailsCtrl = function ($scope, $routeParams, $location, $dialog, $modalInstance, SessionService, RCommNumbers, RCommApps, Notifications) {

  // are we editing details...
  if($scope.phoneSid = $routeParams.phoneSid) {
    $scope.sid = SessionService.get("sid");

    $scope.numberDetails = RCommNumbers.get({accountSid:$scope.sid, phoneSid: $scope.phoneSid});
  } // or registering a new one ?
  else {
    // start optional items collapsed
    $scope.isCollapsed = true;

    $scope.closeRegisterIncomingNumber = function () {
      $modalInstance.dismiss('cancel');
    };
  }

  // query for available apps
  $scope.availableApps = RCommApps.query();

  var createNumberParams = function(number) {
    var params = {};

    // Mandatory fields
    if(number.phone_number) {
      params["PhoneNumber"] = number.phone_number;
    }
    else if(number.area_code) {
      params["AreaCode"] = number.area_code;
    }
    else {
      alert("You must provide either Number or Area Code.");
    }

    // Optional fields
    if (number.friendly_name) {
      params["FriendlyName"] = number.friendly_name;
    }
    if (number.voice_url) {
      params["VoiceUrl"] = number.voice_url;
      params["VoiceMethod"] = number.voice_method;
    }
    if (number.voice_fallback_url) {
      params["VoiceFallbackUrl"] = number.voice_fallback_url;
      params["VoiceFallbackMethod"] = number.voice_fallback_method;
    }
    if (number.status_callback_url) {
      params["StatusCallback"] = number.status_callback_url;
      params["StatusCallbackMethod"] = number.status_callback_method;
    }
    if (number.sms_url) {
      params["SmsUrl"] = number.sms_url;
      params["SmsMethod"] = number.sms_method;
    }
    if (number.sms_fallback_url) {
      params["SmsFallbackUrl"] = number.sms_fallback_url;
      params["SmsFallbackMethod"] = number.sms_fallback_method;
    }
    if (number.voice_caller_id_lookup) {
      params["VoiceCallerIdLookup"] = number.voice_caller_id_lookup;
    }

    return params;
  }

  $scope.registerIncomingNumber = function(number) {
    var params = createNumberParams(number);
    RCommNumbers.register({accountSid: $scope.sid}, $.param(params),
      function() { // success
        Notifications.success('Number "' + number.phone_number + '" created successfully!');
        $modalInstance.close();
      },
      function() { // error
        Notifications.error('Failed to register number "' + number.phone_number + '".');
      }
    );
  };

  $scope.updateIncomingNumber = function(number) {
    var params = createNumberParams(number);
    RCommNumbers.update({accountSid: $scope.sid, phoneSid: $scope.phoneSid}, $.param(params),
      function() { // success
        Notifications.success('Number "' + number.phone_number + '" updated successfully!');
      },
      function() { // error
        Notifications.error('Failed to update number "' + number.phone_number + '".');
      }
    );
  };

  $scope.confirmNumberDelete = function(phone) {
    confirmNumberDelete(phone, $dialog, $scope, RCommNumbers, $location);
  }
};

var confirmNumberDelete = function(phone, $dialog, $scope, RCommNumbers, Notifications, $location) {
  var title = 'Delete Number ' + phone.phone_number;
  var msg = 'Are you sure you want to delete incoming number ' + phone.phone_number + ' (' + phone.friendly_name +  ') ? This action cannot be undone.';
  var btns = [{result:'cancel', label: 'Cancel'}, {result:'confirm', label: 'Delete!', cssClass: 'btn-danger'}];

  $dialog.messageBox(title, msg, btns)
    .open()
    .then(function(result) {
      if (result == "confirm") {
        RCommNumbers.delete({accountSid:$scope.sid, phoneSid:phone.sid}, {},
          function() {
            if($location) {
              $location.path( "/numbers/incoming/" );
            }
            else {
              $scope.numbersList = RCommNumbers.query({accountSid:$scope.sid});
            }
          },
          function() {
            // TODO: Show alert on delete failure...
          }
        );
      }
    });
};