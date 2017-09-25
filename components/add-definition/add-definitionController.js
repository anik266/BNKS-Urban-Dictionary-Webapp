'use strict';

cs142App.controller('AddDefinitionController', ['$scope', '$routeParams', '$resource', '$location',
  function ($scope, $routeParams, $resource, $location) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    var userId = $routeParams.userId;
    $scope.main.title = 'Add Word';
    $scope.main.displayHomepage = false;
    $scope.adding_failed_not_logged_in = false;

    $scope.post_definition_function = function(){
      // Parse tags[] here
      if($scope.add_tags_string){
        var hash_stripped = $scope.add_tags_string.replace(/#/g, '');
        var space_stripped = hash_stripped.replace(/\s+/g, '');
        var tags_stripped = space_stripped.split(',');
        if (tags_stripped.length > 5){
          tags_stripped = tags_stripped.slice(0,5);
        }
        tags_stripped = tags_stripped.filter(function(n){ return (n !== undefined && n.length !== 0)}); 
        tags_stripped = Array.from( new Set(tags_stripped));
      }
      else{
        var tags_stripped = [];
      }
      var submittedObj = {
        word: $scope.main.customAddWordDefinitionName, 
        definition: $scope.add_definition,
        example: $scope.add_example,
        tags: tags_stripped
      };
      var addWord = $resource("/addWord");
      $scope.newlyAdded = addWord.save(submittedObj, function(){
          //Display success message here
          $scope.main.customAddWordDefinitionName = undefined;

          // Redirect the view to load this word's detail page
          // console.log($scope.newlyAdded);
          
          $location.path('/word/'+$scope.newlyAdded._id);
      }, 
      function(){
        $scope.adding_failed_not_logged_in = true;
      });
      
      // console.log(submittedObj);
    };

  }]);