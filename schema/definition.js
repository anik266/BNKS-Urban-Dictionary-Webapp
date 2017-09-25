"use strict";

/*
 * Defined the Mongoose Schema and return a Model for a Photo
 */

/* jshint node: true */

var mongoose = require('mongoose');

// create a schema for Definition
var definitionSchema = new mongoose.Schema({
  word: String,
  parent_id: mongoose.Schema.Types.ObjectId,    // ID of the wordgroup it belongs to
  definition: String,
  example: {type: String, default: ""},
  tags: [String],
  creator: {user_id: mongoose.Schema.Types.ObjectId, login_name: String},
  date_time: {type: Date, default: Date.now}, //  The date and time when the definition was added to the database.
  faved_by: [mongoose.Schema.Types.ObjectId]     // login_name of users who fave this definition
});

// the schema is useless so far
// we need to create a model using it
var Definition = mongoose.model('Definition', definitionSchema);

// make this available to our photos in our Node applications
module.exports = Definition;