#!/usr/bin/env node
var pouch=require('pouchdb');
var mentorDb = new PouchDB('mentors');

mentorSync = mentorDb.sync('https://pouchdb:pouchdbpassword8@gpementor.iriscouch.com/mentors', {live: true})
  .on('error', function (err) {
    console.log("Syncing stopped");
    console.log(err);
  }).on('change',function(info){
    console.log(info);
  })


newbSync = newbDb.sync('https://pouchdb:pouchdbpassword8@gpementor.iriscouch.com/newbs', {live: true})
  .on('error', function (err) {
    console.log("Syncing stopped");
    console.log(err);
  }).on('change',function(info){
    console.log(info);
  })
