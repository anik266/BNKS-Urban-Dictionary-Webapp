'use strict';

cs142App.controller('UserDetailController', ['$scope', '$routeParams', '$resource',
  function ($scope, $routeParams, $resource) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    $scope.main.displayHomepage = false;
    $scope.main.title = "BNKS Urban User";
    var userId = $routeParams.userId;    
    $scope.userFound = true;

    var Users = $resource("/user/:id");
    $scope.userDetail = Users.get({id: userId}, function(){
      $scope.userFound = true;
      $scope.main.title = $scope.userDetail.login_name;
    },function(){
      $scope.userFound = false;
    });

  }]);