'use strict';

cs142App.controller('DefinitionViewController', ['$scope', '$routeParams', '$resource', '$location',
  function ($scope, $routeParams, $resource, $location) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */

    $scope.showPendingMessage = false;
    var wordId = $routeParams.wordId;
    $scope.main.displayHomepage = false;
    $scope.main.title = "Word Definition";

    var fetchWord = $resource('/getWord/:id');
    $scope.word = fetchWord.get({id: wordId}, function(){
      $scope.main.title = $scope.word.wordname;
    }, function(){
      $scope.showPendingMessage = true;
    });


    $scope.appendDefinition = function(){
      $scope.main.customAddWordDefinitionName = $scope.word.wordname;
      $location.path('/add-definition');
    };

  }]);