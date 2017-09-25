'use strict';

cs142App.controller('PersonalViewController', ['$scope', '$routeParams', '$resource',
  function ($scope, $routeParams, $resource) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    $scope.main.displayHomepage = false;
    $scope.main.title = "My Account";
    $scope.user = $scope.main.getCurrentUser();
    $scope.data = {};
    $scope.admin = {};
    $scope.admin.showPanel = false;
    $scope.admin.showMod = false;

    var pendingWordsReq = $resource("/pendingWords");
    var Userlistreq = $resource("/user/list");

    var Users = $resource("/user/:id");
    $scope.userDetail = Users.get({id: $scope.user._id}, function(){
      // console.log($scope.userDetail);
      if($scope.userDetail.role > 2){
        $scope.pendingWords = pendingWordsReq.query({}, function(){
          // console.log($scope.pendingWords);
        });
      }

      if($scope.userDetail.role > 3){
        $scope.userList = Userlistreq.query({}, function(){
          // console.log($scope.userList);
        });
      }
    });

    $scope.refreshTask = function(){
      var pendingWordsReq = $resource("/pendingWords");
      $scope.pendingWords = pendingWordsReq.query({}, function(){
      });
    };

    $scope.acceptWord = function(w){
      var acceptReq = $resource("/approveWord");
      var letsAccept = acceptReq.save({id: w._id}, function(){
        // console.log("success");
        w.wordname = "";
      }, function(){
        // console.log("failure");
      });
    };

    $scope.declineWord = function(w){
      var deleteReq = $resource("/deleteWord");
      var letsDelete = deleteReq.save({id: w._id}, function(){
        // console.log("success");
        w.wordname = "";
      }, function(){
        // console.log("failure");
      });
    };

    $scope.toggleAdminPanel = function(){
      if($scope.admin.showPanel === false){
        $scope.admin.showPanel = true;
        $scope.admin.ActionMsg = "";
      }
      else if($scope.admin.showPanel === true){
        $scope.admin.showPanel = false;
        $scope.admin.ActionMsg = ""
      }
    };

    $scope.toggleModPanel = function(){
      if($scope.admin.showMod === false){
        $scope.admin.showMod = true;
      }
      else if($scope.admin.showMod === true){
        $scope.admin.showMod = false;
      }
    };

    $scope.upDateAuth = function(user_id, newAuthLevel){
      if(newAuthLevel !== undefined && user_id !== undefined){
        var updateAuthReq = $resource("/updateUser");
        var letsAccept = updateAuthReq.save({id: user_id, newRole: newAuthLevel}, function(){
          // console.log("successfully updated user, ", user_id);
          $scope.admin.ActionMsg = "User was successfully updated.";
        }, function(){
          // console.log("failure in updating");
          $scope.admin.ActionMsg = "User update failed.";
        });
      }
    };


    $scope.deleteUser = function(user_id){
      if(user_id !== undefined){
        var delUserReq = $resource("/deleteUser");
        var letsAccept = delUserReq.save({id: user_id}, function(){
          // console.log("successfully deleted user, ", user_id);
          $scope.admin.ActionMsg = "User has been deleted.";
        }, function(){
          // console.log("failure in deleting");
          $scope.admin.ActionMsg = "User deleted failed.";
        });
      }
    };

  }]);