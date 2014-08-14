var pouch     = require('pouchdb');
var mentorDb  = new pouch('mentors');
var newbDb    = new pouch('newbs');
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
     if      (a[ai]["_id"] < b[bi]["_id"] ){ ai++; }
     else if (a[ai]["_id"] > b[bi]["_id"] ){ bi++; }
     else /* they're equal */
     {
       result.push(a[ai]);
       ai++;
       bi++;
     }
  }

  return result;
}

mentorSync = mentorDb.sync('https://pouchdb:pouchdbpassword8@gpementor.iriscouch.com/mentors', {live: true})
  .on('error', function (err) {
    console.log("Syncing stopped");
    console.log(err);
  }).on('change',function(info){
    console.log(info);
  }).on('uptodate',function(info){
    console.log('mentors Synced!')
  })


newbSync = newbDb.sync('https://pouchdb:pouchdbpassword8@gpementor.iriscouch.com/newbs', {live: true})
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

  mentor_data = JSON.parse(data);
  newbDb.allDocs({include_docs: true},function(err, response){
    var arr=[];
    for (var i = 0; i < response.rows.length; i++) {
      arr.push(response.rows[i].doc)
    }
    new_mentors=intersect_safe(arr,mentor_data);
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
  newb_data = JSON.parse(data);

  newbDb.allDocs({include_docs: true},function(err, response){
    var arr=[];
    for (var i = 0; i < response.rows.length; i++) {
      arr.push(response.rows[i].doc)
    }
    new_newbs=intersect_safe(arr,newb_data);
    newbDb.bulkDocs(newb_data,function(err, res) {
      if (err) console.log(err);
      console.log(res);
    });
    console.log("new_newbs");
    console.log(new_newbs);
  });
});


//console.log(newb_data);
// adding the stuff in a callback
