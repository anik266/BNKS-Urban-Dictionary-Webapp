'use strict';

var cs142App = angular.module('cs142App', ['ngRoute', 'ngMaterial', 'ngResource']);

cs142App.config(['$routeProvider',
  function ($routeProvider) {
      $routeProvider.
          when('/users/:userId', {
              templateUrl: 'components/user-detail/user-detailTemplate.html',
              controller: 'UserDetailController'
          }).
          when('/login-register', {
              templateUrl: 'components/login-register/login-registerTemplate.html',
              controller: 'LoginRegisterController'
          }).
          when('/add-definition', {
              templateUrl: 'components/add-definition/add-definitionTemplate.html',
              controller: 'AddDefinitionController'
          }).
          when('/word/:wordId', {
              templateUrl: 'components/definition-view/definition-viewTemplate.html',
              controller: 'DefinitionViewController'
          }).
          when('/me', {
              templateUrl: 'components/personal-view/personal-viewTemplate.html',
              controller: 'PersonalViewController'
          }).
          when('/about', {
              templateUrl: 'components/info-pages/aboutTemplate.html',
              controller: 'AboutController'
          }).
          when('/search/:text', {
              templateUrl: 'components/search-view/search-viewTemplate.html',
              controller: 'SearchViewController'
          }).
          otherwise({
              redirectTo: '',
          });
  }]);

cs142App.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('dark-grey').backgroundPalette('grey').dark();
  $mdThemingProvider.theme('dark-orange').backgroundPalette('orange').dark();
  $mdThemingProvider.theme('dark-purple').backgroundPalette('deep-purple').dark();
  $mdThemingProvider.theme('dark-blue').backgroundPalette('blue').dark();
});

cs142App.config(['$mdIconProvider', function($mdIconProvider) {
  $mdIconProvider.icon('md-toggle-arrow', 'img/icons/toggle-arrow.svg', 48);
}])

cs142App.controller('MainController', ['$scope', '$resource', '$rootScope', '$location', '$http',
  function ($scope, $resource, $rootScope, $location, $http) {
      $scope.main = {};
      $scope.main.title = 'BNKS Urban Dictionary';
      $scope.main.displayHomepage = true;
      $scope.main.customAddWordDefinitionName = undefined;
      $scope.main.feeds = [];
      $scope.randomGeneratedId;
      $scope.main.randomWords = [];
      $scope.searchString = "";
      $scope.main.currentUser = {};

      $scope.main.getCurrentUser = function(){
        return JSON.parse(window.localStorage.getItem("currentlyLogged"));
      };
      
      $scope.main.isLogged = function(){
        if(window.localStorage.getItem("currentlyLogged") === null){
            return false;
        }
        return true;
      };

      $scope.main.refreshCurrentUser = function(){
        var userFromDB = $resource("/user/:id");
        if($scope.main.isLogged()){
          $scope.main.currentUser = userFromDB.get({id: $scope.main.getCurrentUser()._id}, function(){
            // console.log($scope.main.currentUser);
          });
        }
      };
      $scope.main.refreshCurrentUser();

      $scope.logout = function(){
        //TODO
        window.localStorage.clear();
        $scope.main.currentUser = {};

        // make the logging http POST request
        var LogOff = $resource("/admin/logout");
        $scope.userDetail = LogOff.save({}, function(){
          window.localStorage.removeItem("currentlyLogged");
          // Redirect the view to login page
          $location.path('/login-register');
        },
        function(){
          // console.log("Logout failed...");
        });
      };

      $scope.generateRandom = function(){
        var getrandomreq = $resource("/randomWord");
        var received = getrandomreq.query({}, function(){
          if ((received !== null) && (received.length > 0)){
            $scope.randomGeneratedId = received[0]._id;
          }
          else{
            $scope.generateRandom();
          }
        });
      };
      $scope.generateRandom();

      $scope.generateRandom5 = function(){
        var getrandomreq = $resource("/randomWords");
        var received = getrandomreq.query({}, function(){
          if ((received !== null) && (received.length > 0)){
            // console.log(received);
            $scope.main.randomWords = received;
          }
        }, function(){
          // console.log("fail");
        });
      };
      $scope.generateRandom5();

      $scope.main.refreshWords = function(){
        var words_defined = $resource("/getWords");
        $scope.main.words = words_defined.query({}, function(){
          // console.log($scope.main.words);
        });
      };

      $scope.search = function(){
        $location.path('/search/'+$scope.searchString);
        $scope.searchString = undefined;
      };

      $scope.main.addToFav = function(word){
        //Call addfav api here
        var addFavReq = $resource("/favorite");
        var addingtofav = addFavReq.save({definition:word}, function(){
          // TODO: increment fav count in realtime
          word.faved_by.push("temp");
        },
        function(){
          // console.log("Faving def failed...");
        });
      };

      $scope.main.removeFromFav = function(word){
        //Call addfav api here
        var remFavReq = $resource("/unfavorite");
        var removingfromfav = remFavReq.save({definition:word}, function(){
          //Display success message here
          // console.log(addingtofav);
          word.word = "";
        },
        function(){
          // console.log("Un-faving def failed...");
        });
      };

      $scope.main.deleteDef = function(def){
        var deleteReq = $resource("/deleteDef");
        var letsDelete = deleteReq.save(def, function(){
          // console.log("success - deleted def");
          def.word = "";
        }, function(){
          // console.log("failure to delete def");
        });
      };

      $scope.main.deleteWord = function(wid){
        var deleteReq = $resource("/deleteWord");
        var letsDelete = deleteReq.save({id: wid}, function(){
          // console.log("success - deleted word");
        }, function(){
          // console.log("failure to delete word");
        });
      };

      $rootScope.$on( "$routeChangeStart", function(event, next, current) {
        if (next.templateUrl !== "components/add-definition/add-definitionTemplate.html") {
          $scope.main.customAddWordDefinitionName = undefined;
        }
      });
      

  }]);