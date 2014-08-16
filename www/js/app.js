
angular.module('reporting', ['ionic'])
  // Simple PouchDB factory
  .factory('reportDb', function() {
    var db = new PouchDB('reports');
    return db;
  })
  .factory('newbDb',function(){
    var db = new PouchDB('newb_list_0');
    return db;
  })
  .factory('mentorDb',function(){
    var db = new PouchDB('mentor_list_0');
    return db;
  })
  .factory('localstorage', ['$window', function($window) {
    return {
      set: function(key, value) {
        $window.localStorage[key] = value;
      },
      get: function(key, defaultValue) {
        return $window.localStorage[key] || defaultValue;
      },
      setObject: function(key, value) {
        $window.localStorage[key] = JSON.stringify(value);
      },
      getObject: function(key,defaultObject) {
        defaultObject = typeof defaultObject !== 'undefined' ? JSON.stringify(defaultObject) : "{}";
        return JSON.parse($window.localStorage[key] || defaultObject);
      }
    }
  }])

  // indexedDB.deleteDatabase('_pouch_reports');
  // indexedDB.deleteDatabase('_pouch_reports-mrview-temp');
  // indexedDB.deleteDatabase('_pouch_newbs');
  // indexedDB.deleteDatabase('_pouch_mentors');
  // indexedDB.deleteDatabase('_pouch_reports');
  // indexedDB.deleteDatabase('_pouch_reports-mrview-temp');
  // indexedDB.deleteDatabase('_pouch_newb_list');
  // indexedDB.deleteDatabase('_pouch_mentor_list');
  // indexedDB.deleteDatabase('_pouch_newb_list_0');
  // indexedDB.deleteDatabase('_pouch_mentor_list_0');


  .controller('reportCtrl', function($scope, $ionicModal,$http, reportDb,newbDb,mentorDb, $ionicPopup, $ionicListDelegate,localstorage) {
    // Initialize reports
    $scope.reports = [];
    $scope.my_reports = [];
    $scope.synced = false;
    $scope.total_reports = 0;
    $scope.mentor = localstorage.getObject('mentor',{name:'Not You',id:"0"});
    $scope.last_sync = localstorage.get('last_sync',0)
    $scope.newb = undefined;

    $scope.newbs=[];
    $scope.mentors=[];

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
      $scope.newbSync = newbDb.sync('https://pouchdb:pouchdbpassword8@gpementor.iriscouch.com/newb_list_0', {live: true})
      .on('error', function (err) {
        console.log("Syncing newbs stopped");
        console.log(err);
      });

    $scope.mentorSync = mentorDb.sync('https://pouchdb:pouchdbpassword8@gpementor.iriscouch.com/mentor_list_0', {live: true})
    .on('error', function (err) {
      console.log("Syncing mentors stopped");
      console.log(err);
    });

    $scope.sync = reportDb.sync('https://pouchdb:pouchdbpassword8@gpementor.iriscouch.com/reports', {live: true})
      .on('error', function (err) {
        console.log("Syncing stopped");
        console.log(err);
      });
    $scope.sync.on('complete', function (info) {
      $scope.synced = false;

    }).on('uptodate', function (info) {
      $scope.synced = true;
      $scope.last_sync=Date.now();
      localstorage.set('last_sync',$scope.last_sync);
    }).on('change',function(info){
      console.log(info);
    })

    mentorDb.changes({
      live: true,
      onUpToDate: function (change) {
        $scope.getMentors();
      }
    });

    newbDb.changes({
      live: true,
      onUpToDate: function (change) {
        $scope.getNewbs();
      }
    });

    reportDb.changes({
      live: true,
      onChange: function (change) {
        reportDb.info(function(err,resp){
          $scope.report_count=resp.doc_count;
        });

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
      r.mentor_id=$scope.mentor.id
      r.mentor = $scope.mentor.name;
      r.newb = $scope.newb.name;
      r.newb_id = $scope.newb.id;
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
      $scope.newb={name:this_report.newb,id:this_report.newb_id};
      $scope.reportModal.show();
    }


    $scope.newReport = function(newb) {

      if ($scope.mentor.name == "Not You") {
        $scope.mentorModal.show();
      }else{
        $scope.newb=newb;
        // defaulting things appropriately
        r={};
        r.protocol = "5";
        r.social = "5";
        r.small = "5";
        r.large = "5";
        r.safety = "5";
        r.theater = "5";
        r.direction = "5";
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


    $scope.getMentors = function(){
      $scope.mentors=[];
      mentorDb.allDocs({include_docs: true},function(err, response){
        $scope.$apply(function() { //UPDATE scope
          for (var i = 0; i < response.rows.length; i++) {
            var row=response.rows[i];
            $scope.mentors.push(row.doc)
            if ($scope.newbs.indexOf(row.doc) !== -1) {
              $scope.newbs.slice($scope.newbs.indexOf(row.doc),1);
            }
          }
          console.log("got the mentors");
          console.log($scope.mentors.length);
        });
      });

    }

    $scope.getNewbs = function(){
      $scope.newbs=[];
      newbDb.allDocs({include_docs: true},function(err, response){
        $scope.$apply(function() { //UPDATE scope
          for (var i = 0; i < response.rows.length; i++) {
            var row=response.rows[i];
            $scope.newbs.push(row.doc);
          }
          console.log("got the newbs");
          console.log($scope.newbs.length);
        });
      });

    }

    $scope.showMentors = function(){
      $scope.getMentors();
      $scope.mentorModal.show();
    }
    $scope.hideMentors = function(){
      $scope.mentorModal.hide();
    }
    $scope.selectMentor = function(mentor){
      $scope.mentor = mentor;
      localstorage.setObject('mentor', mentor);
      $scope.mentorModal.hide();
    }

    // Create our report modal
    $ionicModal.fromTemplateUrl('report-list.html', function(modal) {
      $scope.reportListModal = modal;

    }, {
      scope: $scope
    });

    $scope.showReportList = function(){
      if ($scope.mentor.name == "Not You") {
        $scope.mentorModal.show();
      }else{
        $scope.myReports();
        $scope.reportListModal.show();
      }
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
            if ($scope.mentor.id == response.rows[i].doc.mentor_id) {
              console.log(response.rows[i].doc);
              $scope.my_reports.push(response.rows[i].doc);
            }
          }
          console.log($scope.my_reports);
        });
      });
    }
    $scope.updateData=function(){
      $scope.getNewbs();
      $scope.getMentors();
    }
    $scope.getNewbs();
  });
