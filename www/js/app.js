angular.module('reporting', ['ionic'])
  // Simple PouchDB factory
  .factory('reportDb', function() {
    var db = new PouchDB('reports');
    return db;
  })
  // .factory('mentorList',function(){
  //   return $http.get('/mentors.json');
  // })
  // .factory('newbList',function(){
  //   return $http.get('/newbs.json');
  // })
  .controller('reportCtrl', function($scope, $ionicModal,$http, reportDb, $ionicPopup, $ionicListDelegate) {
    // Initialize reports
    $scope.reports = [];

    $scope.mentor = window.localStorage['mentor'] || 'Not You';
    $scope.newb= "undefined";

    $http.get('mentors.json').success(function (data) {
        $scope.mentors = data;
    });
    $http.get('newbs.json').success(function (data) {
        $scope.newbs = data;
    });

    ////////////////////////
    // Online sync to CouchDb
    ////////////////////////
    $scope.sync = reportDb.sync('http://127.0.0.1:5984/reports', {live: true})
      .on('error', function (err) {
        console.log("Syncing stopped");
        console.log(err);
      });

    reportDb.changes({
      live: true,
      onChange: function (change) {
        if (!change.deleted) {
          reportDb.get(change.id, function(err, doc) {
            if (err) console.log(err);
            $scope.$apply(function() { //UPDATE
              for (var i = 0; i < $scope.reports.length; i++) {
                if ($scope.reports[i]._id === doc._id) {
                  $scope.reports[i] = doc;
                  return;
                }
              } // CREATE / READ
              $scope.reports.push(doc);
            });
          })
        } else { //DELETE
          $scope.$apply(function () {
            for (var i = 0; i<$scope.reports.length; i++) {
              if ($scope.reports[i]._id === change.id) {
                $scope.reports.splice(i,1);
              }
            }
          })
        }
      }
    });

    $scope.update = function (report) {
      reportDb.get(report._id, function (err, doc) {
        if (err) {
          console.log(err);
        } else {
          reportDb.put(angular.copy(report), doc._rev, function (err, res) {
            if (err) console.log(err);
          });
        }
      });
    };

    $scope.delete = function(report) {
      reportDb.get(report._id, function (err, doc) {
        reportDb.remove(doc, function (err, res) {});
      });
    };

    // $scope.editReport = function (report) {
    //   var scope = $scope.$new(true);
    //   scope.data = { response: report.title } ;
    //   $ionicPopup.prompt({
    //     title: 'Edit report:',
    //     scope: scope,
    //     buttons: [
    //       { text: 'Cancel',  onTap: function(e) { return false; } },
    //       {
    //         text: '<b>Save</b>',
    //         type: 'button-positive',
    //         onTap: function(e) {
    //           return scope.data.response
    //         }
    //       },
    //     ]
    //   }).then(function (newTitle) {
    //     if (newTitle && newTitle != report.title) {
    //       report.title = newTitle;
    //       $scope.update(report);
    //     }
    //     $ionicListDelegate.closeOptionButtons();
    //   });
    // };

    // Create our report modal
    $ionicModal.fromTemplateUrl('new-report.html', function(modal) {
      $scope.reportModal = modal;
    }, {
      scope: $scope
    });

    $scope.createReport = function(report) {
      report.completed = false;
      report.timestamp = Math.round(+new Date()/1000);
      report.millitimestamp = Date();
      report.mentor=$scope.mentor;
      report.newb=$scope.newb;
      reportDb.post(angular.copy(report), function(err, res) {
        if (err) console.log(err)

        if (res) console.log(res);
      });


      $scope.reportModal.hide();
      $scope.reportModal=undefined;
      // Create our report modal
      $ionicModal.fromTemplateUrl('new-report.html', function(modal) {
        $scope.reportModal = modal;
      }, {
        scope: $scope
      });
    };

    $scope.editReport = function(report) {
      $scope.this_report=report;
      $score.reportModal.show();
    }

    $ionicModal.fromTemplateUrl('new-report.html', function(modal) {
      $scope.reportModal = modal;
    }, {
      scope: $scope
    });

    $scope.newReport = function(newb) {

      if ($scope.mentor == "Not You") {
        $scope.mentorModal.show();
      }else{
        $scope.newb=newb;
        $scope.reportModal.show();
      }
    };

    $scope.closeNewReport = function() {
      $scope.reportModal.hide();
      $scope.reportModal.destroy();
      // Create our report modal
      $ionicModal.fromTemplateUrl('new-report.html', function(modal) {
        $scope.reportModal = modal;
      }, {
        scope: $scope
      });
    };
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.reportModal.remove();
    });

    // Create our mentor modal
    $ionicModal.fromTemplateUrl('mentor-list.html', function(modal) {
      $scope.mentorModal = modal;
    }, {
      scope: $scope
    });

    $scope.showMentors = function(){
      $scope.mentorModal.show();
    }
    $scope.hideMentors = function(){
      $scope.mentorModal.hide();
    }
    $scope.selectMentor = function(mentor){
      $scope.mentor = mentor;
      window.localStorage['mentor'] = mentor;
      $scope.mentorModal.hide();
    }

    // Create our report modal
    $ionicModal.fromTemplateUrl('report-list.html', function(modal) {
      $scope.reportListModal = modal;

    }, {
      scope: $scope
    });

    $scope.showReportList = function(){
      $scope.myReports();
      $scope.reportListModal.show();
    }
    $scope.hideReportList = function(){
      $scope.my_reports=[];
      $scope.reportListModal.hide();
    }

    $scope.myReports = function(){
      var results;
      function map(doc){
        if (doc.mentor==$scope.mentor) {
          emit(doc);
        }
      }

      reportDb.query({map: map},{reduce: false},function(err,response){
        if (err) {
          console.log(err);
        }
        if (response) {
          console.log(response);
          results = response;
          $scope.my_reports = results;
        }
      });
      return results;
    }


  });
