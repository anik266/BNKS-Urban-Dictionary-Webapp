'use strict';

cs142App.controller('SearchViewController', ['$scope', '$routeParams', '$resource',
  function ($scope, $routeParams, $resource) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    $scope.main.displayHomepage = false;
    $scope.main.title = "Search BNKS Urban";
    $scope.searchText = $routeParams.text;    

    var searchReq = $resource("/search/:text");
    $scope.searchResult = searchReq.query({text: $scope.searchText}, function(){
      if($scope.searchResult.length === 0){
        // console.log("no results found");
      }
      else{
        //success

      }
    }, function(){
      // console.log("search failed");
    });

  }]);