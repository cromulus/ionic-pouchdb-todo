angular.module('reporting', ['ionic'])
  // Simple PouchDB factory
  .factory('reportDb', function() {
    var db = new PouchDB('reports');
    return db;
  })
  // indexedDB.deleteDatabase('_pouch_reports');
  // indexedDB.deleteDatabase('_pouch_reports-mrview-temp');

  .controller('reportCtrl', function($scope, $ionicModal,$http, reportDb, $ionicPopup, $ionicListDelegate) {
    // Initialize reports
    $scope.reports = [];
    $scope.my_reports = [];
    $scope.synced=false;
    $scope.mentor = window.localStorage['mentor'] || 'Not You';
    $scope.newb = "undefined";

    $http.get('mentors.json').success(function (data) {
        $scope.mentors = data;
    });
    $http.get('newbs.json').success(function (data) {
        $scope.newbs = data;
    });

    //initializing the report
    var report_props = ['report.protocol',
                        'report.social',
                        'report.small',
                        'report.large',
                        'report.safety',
                        'report.theater',
                        'report.direction'];
    for (var i = 0; i < report_props.length; i++) {
      $scope.$watch(report_props[i], function() {
        // where we would put an unblur
      });
    }

    ////////////////////////
    // Online sync to CouchDb
    ////////////////////////
    $scope.sync = reportDb.sync('http://127.0.0.1:5984/reports', {live: true})
      .on('error', function (err) {
        console.log("Syncing stopped");
        console.log(err);
      });1

    reportDb.changes({
      live: true,
      onChange: function (change) {
        reportDb.info(function(err,resp){
          $scope.report_count=resp.doc_count;
        });
        if (change.complete){
          $scope.synced = false;
        }
        if (change.uptodate) {
          $scope.synced = true;
        }

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
      console.log('deleting');
      console.log(report);

      reportDb.get(report._id, function (err, doc) {
        reportDb.remove(doc, function (err, res) {});
      });
      $scope.my_reports.splice( $scope.my_reports.indexOf(report), 1 );
      console.log($scope.my_reports);
    };

    // Create our report modal
    $ionicModal.fromTemplateUrl('new-report.html', function(modal) {
      $scope.reportModal = modal;
    }, {
      scope: $scope
    });

    $scope.createReport = function(r) {
      if (typeof(r._id!=="undefined")) {

      }
      r.timestamp = Math.round(+new Date()/1000);
      r.millitimestamp = Date.now();
      r.mentor = $scope.mentor;
      r.newb = $scope.newb;

      reportDb.post(angular.copy(r), function(err, res) {
        if (err) console.log(err)

        if (res) console.log(res);
      });

      $scope.newb = undefined; // unset the newb

      $scope.reportModal.hide();
      // Create our report modal
      $ionicModal.fromTemplateUrl('new-report.html', function(modal) {
        $scope.reportModal = modal;
      }, {
        scope: $scope
      });
    };


    $scope.editReport = function(this_report) {
      $scope.report=this_report;
      $scope.newb=this_report.newb;
      $scope.reportModal.show();
    }


    $scope.newReport = function(newb) {

      if ($scope.mentor == "Not You") {
        $scope.mentorModal.show();
      }else{
        $scope.newb=newb;
        // defaulting things appropriately
        r={};
        r.protocol = 5;
        r.social = 5;
        r.small = 5;
        r.large = 5;
        r.safety = 5;
        r.theater = 5;
        r.direction = 5;
        $scope.report=r;
        $scope.reportModal.show();
      }
    };

    $scope.closeNewReport = function() {
      $scope.reportModal.hide();
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
      $scope.my_reports=[];
      reportDb.allDocs({include_docs: true},function(err, response){
        $scope.$apply(function() { //UPDATE

          for (var i = 0; i < response.rows.length; i++) {
            console.log(response.rows[i].doc._id);
            if ($scope.mentor === response.rows[i].doc.mentor) {
              $scope.my_reports[i] = response.rows[i].doc;
            }
          } // CREATE / READ
          // $scope.my_reports.push(doc);
        });
        //
        // for (var i = 0; i < response.rows.length; i++) {
        //   console.log(response.row[i]);
        //   if (response.rows[i].name == $scope.mentor) {
        //     $scope.my_reports.push(response.rows.rows[i])
        //   }
        // }
      });


    }
    $scope.closeKeyboard=function(){
      cordova.plugins.Keyboard.close();
    }
  });
