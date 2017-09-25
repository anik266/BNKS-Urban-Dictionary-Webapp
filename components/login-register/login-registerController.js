'use strict';

cs142App.controller('LoginRegisterController', ['$scope', '$routeParams', '$resource', '$location',
  function ($scope, $routeParams, $resource, $location) {
    $scope.main.title = "Login/Register";
    $scope.main.displayHomepage = false;
    $scope.l = {};
    $scope.r = {};

    //Boolean triggers for show/hide login form
    $scope.displaySignUpForm = false;
    $scope.displayLoginForm = true;

    $scope.loginFailed = false;
    $scope.isRegisterError = false;
    $scope.isRegisterSuccess = false;
    $scope.registerErrors = [];
    $scope.successMessage = "Your account was created. Please login.";

    $scope.clearForm = function(){
      $scope.r.register_login_name = undefined;
      $scope.r.register_password1 = undefined; 
      $scope.r.register_password2 = undefined;
      $scope.l.password = undefined;
    };

    $scope.cancel = function(){
      $scope.main.displayHomepage = true;
      $location.path('/');
    };

    $scope.toggle = function(){
      if ($scope.displaySignUpForm === false){
        $scope.displaySignUpForm = true;
        $scope.displayLoginForm = false;
        $scope.loginFailed = false;
        $scope.clearForm();
      }
      else if($scope.displayLoginForm === false){
        $scope.displaySignUpForm = false;
        $scope.displayLoginForm = true;
        $scope.isRegisterError = false;
        $scope.clearForm();
      }
    };

    $scope.login = function(){
      $scope.successMessage = undefined;
      // make the logging http POST request
      var Users = $resource("/admin/login");
      $scope.userDetail = Users.save({login_name: $scope.l.login_name, password: $scope.l.password}, function(){
        if($scope.userDetail.$resolved){
          $scope.loginFailed = false;
          $scope.main.userListModel = $resource("/user/list").query();
          // store user in session
          // store it in localstorage to prevent refresh
          var userToStore = {"_id": $scope.userDetail._id, "login_name": $scope.userDetail.login_name};
          window.localStorage.setItem("currentlyLogged", JSON.stringify(userToStore));
          $scope.main.refreshCurrentUser();
          // Redirect the view to load this user's detail page
          // $location.path('/users/'+ $scope.userDetail._id);
          //Refresh words and redirect user to home
          $scope.main.displayHomepage = true;
          // $scope.main.refreshWords();
          $location.path('/');
        }
      },
      function(){
        $scope.clearForm();
        $scope.loginFailed = true;
        $location.path('/login-register');
        // console.log("Login failed...");
      });
    };


    $scope.register = function() {
      $scope.isRegisterSuccess = false;
      $scope.isRegisterError = false;
      $scope.registerErrors = [];
      if($scope.r.register_login_name === undefined){
        $scope.registerErrors.push("Please select a Login name.");
        $scope.isRegisterError = true;
      }
      if ($scope.r.register_password1 === undefined || $scope.r.register_password2 === undefined){
        $scope.registerErrors.push("Passwords must be 5-12 characters.");
        $scope.isRegisterError = true;
      }
      if ($scope.r.register_password1 !== $scope.r.register_password2){
        $scope.r.register_password1 = undefined;
        $scope.r.register_password2 = undefined;
        $scope.registerErrors.push("Please make sure the passwords match.");
        $scope.isRegisterError = true;
      }

      var requestObj = {
        login_name: $scope.r.register_login_name, 
        password: $scope.r.register_password1
      };

      if (!$scope.isRegisterError){
        // console.log("sending post req to /user");
        var SignUp = $resource("/user");
        $scope.userDetail = SignUp.save(requestObj, function(){
          if($scope.userDetail.$resolved){
            $scope.clearForm();
            //Display success message here
            $scope.isRegisterSuccess = true;
            $scope.toggle();
            // Add this register activity to feed

            // POST request to '/feed'
            // var postFeedRes = $resource("/feed");
            // postFeedRes.save({activity_type: "Signup", image_name: null}, function(){
            //   // $scope.main.refreshFeed();
            // }, function(){
            //   console.log("adding user registration to feed failed.");
            // });

            // // Redirect the view to load this user's detail page ?
            // $location.path('/users/'+ $scope.userDetail._id);
          }
        }, 
        function(){
          $scope.isRegisterError = true;
          // console.log("Registration failed...");
          $scope.registerErrors.push("That login name has already been taken.");
          $scope.register_login_name = undefined;
        });
        // End of user registration
      }


    };

  }]);