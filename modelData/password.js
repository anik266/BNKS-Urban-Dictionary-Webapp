"use strict";

/* jshint node: true */

var crypto = require('crypto');

var PasswordMethods = {
      /*
   * Return a salted and hashed password entry from a
   * clear text password.
   * @param {string} clearTextPassword
   * @return {object} passwordEntry
   * where passwordEntry is an object with two string
   * properties:
   *      salt - The salt used for the password.
   *      hash - The sha1 hash of the password and salt
   */
   makePasswordEntry: function makePasswordEntry(clearTextPassword) {
      var hash = crypto.createHash('sha256');
      return hash.update(clearTextPassword).digest("base64");
   },

   /*
   * Return true if the specified clear text password
   * and salt generates the specified hash.
   * @param {string} hash
   * @param {string} salt
   * @param {string} clearTextPassword
   * @return {boolean}
   */
   doesPasswordMatch: function doesPasswordMatch(hash, clearTextPassword) {
      return (hash === crypto.createHash('sha256').update(clearTextPassword).digest("base64"));
   }
};


// make this available to our photos in our Node applications
module.exports = PasswordMethods;