"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for Feed
 */
/* jshint node: true */

var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    login_name: String,
    user_id: String,     // Unique ID identifying this user
    first_name: String, // First name of the user.
    last_name: String,  // Last name of the user.
});

// create a schema
var feedSchema = new mongoose.Schema({
    date_time: {type: Date, default: Date.now},     // date & time when the event occured
    user: userSchema,
    activity: {
      activity_type: String,      // Photo Upload, New Comment, Favorited, Signup, Login, Logout
      image: String               // (Optional) name of the image file
    }
});

// the schema is useless so far
// we need to create a model using it
var Feed = mongoose.model('Feed', feedSchema);

// make this available to our users in our Node applications
module.exports = Feed;