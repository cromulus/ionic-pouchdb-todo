var pouch     = require('pouchdb');
var mentorDb  = new pouch('mentor_list_0');
var newbDb    = new pouch('newb_list_0');
var fs = require('fs');

var mentorfile = __dirname + '/mentors.json';
var newbfile = __dirname + '/newbs.json';

var newb_data;
var mentor_data;


function intersect_safe(a, b)
{
  var ai=0, bi=0;
  var result = new Array();

  while( ai < a.length && bi < b.length )
  {
     if      (a[ai]._id < b[bi]._id ){ ai++; }
     else if (a[ai]._id > b[bi]._id ){ bi++; }
     else /* they're equal */
     {
       result.push(a[ai]);
       ai++;
       bi++;
     }
  }
  return result;
}

// foo - bar
function arrayDiff(foo,bar){
  var baz = [];

  foo.forEach(function(key) {
    if (-1 === bar.indexOf(key)) {
      baz.push(key);
    }
  }, this);
  return baz;
}

mentorSync = mentorDb.sync('https://pouchdb:pouchdbpassword8@gpementor.iriscouch.com/mentor_list_0', {live: true})
  .on('error', function (err) {
    console.log("Syncing stopped");
    console.log(err);
  }).on('change',function(info){
    console.log(info);
  }).on('uptodate',function(info){
    console.log('mentors Synced!')
  })


newbSync = newbDb.sync('https://pouchdb:pouchdbpassword8@gpementor.iriscouch.com/newb_list_0', {live: true})
  .on('error', function (err) {
    console.log("Syncing stopped");
    console.log(err);
  }).on('change',function(info){
    console.log(info);
  }).on('uptodate', function (info) {
    console.log('newbs Synced!')
  })


fs.readFile(mentorfile, 'utf8', function (err, data) {
  if (err) {
    console.log('Error: ' + err);
    return;
  }

  var mentor_data = JSON.parse(data);
  mentorDb.allDocs({include_docs: true},function(err, response){
    var arr=[];
    for (var i = 0; i < response.rows.length; i++) {
      arr.push(response.rows[i].doc)
    }

    // new mentor_data - the mentors we've got
    var new_mentors=arrayDiff(mentor_data,arr);

    console.log("new_mentors");
    console.log(new_mentors);
    mentorDb.bulkDocs(new_mentors,function(err, res) {
      if (err) console.log(err);
      console.log(res);
    });
  });
});

fs.readFile(newbfile, 'utf8', function (err, data) {
  if (err) {
    console.log('Error: ' + err);
    return;
  }
  var newb_data = JSON.parse(data);

  newbDb.allDocs({include_docs: true},function(err, response){
    var arr=[];
    for (var i = 0; i < response.rows.length; i++) {
      arr.push(response.rows[i].doc)
    }

    // subtract old newbs from the set of all newbs
    var new_newbs=arrayDiff(newb_data,arr);

    newbDb.bulkDocs(new_newbs,function(err, res) {
      if (err) console.log(err);
      console.log(res);
    });
    console.log("new_newbs");
    console.log(new_newbs);
  });
});


//console.log(newb_data);
// adding the stuff in a callback
