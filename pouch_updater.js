var pouch     = require('pouchdb');
var mentorDb  = new pouch('mentors');
var newbDb    = new pouch('newbs');
var fs = require('fs');

var mentorfile = __dirname + '/mentors.json';
var newbfile = __dirname + '/newbs.json';

var newb_data;
var mentor_data;

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
  mentorDb.bulkDocs(mentor_data,function(err, res) {
    if (err) console.log(err);
    console.log(res);
  });


});

fs.readFile(newbfile, 'utf8', function (err, data) {
  if (err) {
    console.log('Error: ' + err);
    return;
  }
  newb_data = JSON.parse(data);
  newbDb.bulkDocs(newb_data,function(err, res) {
    if (err) console.log(err);
    console.log(res);
  });
});


//console.log(newb_data);
// adding the stuff in a callback
