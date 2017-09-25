"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a User
 */
/* jshint node: true */

var mongoose = require('mongoose');

// create a schema for Definition
var definitionSchema = new mongoose.Schema({
  word: String,
  parent_id: mongoose.Schema.Types.ObjectId,
  definition: String,
  example: {type: String, default: ""},
  tags: [String],
  creator: {user_id: mongoose.Schema.Types.ObjectId, login_name: String},
  date_time: {type: Date, default: Date.now}, //  The date and time when the definition was added to the database.
  faved_by: [mongoose.Schema.Types.ObjectId]     // login_name of users who fave this definition
});

// create a schema
var userSchema = new mongoose.Schema({
    login_name: String,
    password: String,
    role: {type: Number, default: 1}, // contributor = 1, moderator = 3, administrator = 5
    id: String,     // Unique ID identifying this user
    created: [definitionSchema],
    faved: [definitionSchema]
});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;