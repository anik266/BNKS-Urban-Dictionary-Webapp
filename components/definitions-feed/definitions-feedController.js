'use strict';

cs142App.controller('DefinitionsFeedController', ['$scope', '$routeParams', '$resource',
  function ($scope, $routeParams, $resource) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    var userId = $routeParams.userId;
    $scope.main.title = 'BNKS Urban Dictionary';
    if($scope.main.displayHomepage){
      var words_defined = $resource("/getWords");
      // $scope.main.words = words_defined.query({}, function(){
      //   console.log($scope.main.words);
      // });



      $scope.filtering = words_defined.query({}, function(){
        var arrDef = [];
        for(var i=0; i<$scope.filtering.length; i++){
          var parWord = $scope.filtering[i];
          if(parWord.definitions.length > 0){
            var definition = parWord.definitions[parWord.definitions.length-1];
            arrDef.push(definition);
          }
        }
        $scope.main.words = arrDef;
      });
    }

}]);