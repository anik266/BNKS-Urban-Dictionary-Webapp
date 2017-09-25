'use strict';

cs142App.controller('ActivityFeedController', ['$scope', '$routeParams', '$resource',
  function ($scope, $routeParams, $resource) {
      $scope.main.title = 'Activity Feed';
      $scope.main.context = "Activities Feed";
      $scope.main.userListModel = $resource("/user/list").query();
      $scope.userListModel = $scope.main.userListModel;
      
      var getReq = $resource("/feed");
      $scope.main.feeds = getReq.query({}, function(){
        // console.log("feeds received ", $scope.main.feeds);
      });



  }]);