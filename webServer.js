"use strict";

/* jshint node: true */

/*
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 *
 */

var fs = require("fs");
var mongoose = require('mongoose');
var async = require('async');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);
var express = require('express');
var app = express();


app.use(express.static(__dirname));
app.use(bodyParser.json());

// app.use(bodyParser());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.connect('mongodb://localhost/bnksurbandb');

app.use(session({
    resave: false, 
    saveUninitialized: false,
    cookie: { maxAge: 1000*60*15 },
    secret: "secretKey" ,
    store:new MongoStore({
        mongooseConnection: mongoose.connection
    })
}));

var PasswordMethods = require('./modelData/password.js');
var User = require('./schema/user.js');
var Definition = require('./schema/definition.js');
var WordGroup = require('./schema/word.js');
var Feed = require('./schema/feed.js');



// Extract 40 most recently modified parent words, return [word]
app.get('/getWords', function(request, response){
    var query = WordGroup.find({approved: true}, {'__v':0}).sort({last_modified:-1}).limit(40);

    query.exec(function(err, results) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
        }
        else if (results.length === 0) {
            console.log("No feed records found.");
        }
        else {
            response.end(JSON.stringify(results));
        }
    });   
});

// Should return definitions[] in WordGroup based on fav counts
app.get('/getWord/:id', function(request, response){
    var id = request.params.id;
    WordGroup.findOne({_id: id, approved: true}, {__v:0}, function (err, info) {
        if (err) {
            // Query returned an error.  We pass it back to the browser with an Internal Service
            // Error (500) error code.
            console.error('Doing /getWord error:', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
        if ((info === null) || (info.length === 0)) {
            // Query didn't return an error but didn't find the SchemaInfo object - This
            // is also an internal error return.
            response.status(404).send('WordGroup not found');
            return;
        }
        response.end(JSON.stringify(info));
    });
});

app.get('/randomWord', function(request, response){
    WordGroup.aggregate(
    [ {$match: {approved: true}}, { $sample: { size: 1 }}], function(err, info){
        if(err){
            console.log("Error while getting random word");
            response.status(400).send(JSON.stringify(err));
        }
        response.end(JSON.stringify(info));
    });
});

app.get('/randomWords', function(request, response){
    WordGroup.aggregate(
    [ {$match: {approved: true}}, { $sample: {size: 5}}], function(err, info){
        if(err){
            console.log("Error while getting random word");
            response.status(400).send(JSON.stringify(err));
        }
        response.end(JSON.stringify(info));
    });
});

app.get('/pendingWords', function(request, response){
    if ((!request.session.user_id) || (!request.session.userObj.role > 2)) {
        // no logged user, unauthorized
        response.status(401).send(JSON.stringify("Out of bounds."));
        return;
    }
    var query = WordGroup.find({approved: false}, {'__v':0}).sort({last_modified:1}).limit(20);
    query.exec(function(err, results) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
        }
        else if (results.length === 0) {
        }
        else {
            response.end(JSON.stringify(results));
        }
    });
});

app.post('/approveWord', function(request, response){
    if ((!request.session.user_id) || (!request.session.userObj.role > 2)) {
        // no logged user, unauthorized
        console.error('Out of bounds - approve word');
        response.status(401).send(JSON.stringify("Out of bounds."));
        return;
    }
    WordGroup.findOne({_id: request.body.id}, function(err, info) {
    // hanlde err..
    if (err) {
        // Query returned an error.
        console.error('Doing lookup for wordGroup:', err);
        response.status(400).send(JSON.stringify(err));
        return;
    }

    info.approved = true;
    info.save();
    response.end(JSON.stringify(info));
    });
});

// Deletes the rootWord from Mongo
app.post('/deleteWord', function(request, response){
    if ((!request.session.user_id) || (!request.session.userObj.role > 2)) {
        // no logged user, unauthorized
        console.error('Out of bounds - delete word');
        response.status(401).send(JSON.stringify("Out of bounds."));
        return;
    }
    //TODO: Remove each def in this wordgroup from it's owner's created array
    WordGroup.findOne({_id: request.body.id}, function(err, wordClone) {
        // hanlde err..
        if (err) {
            // Query returned an error.
            console.error('Doing lookup for wordGroup:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if(wordClone !== null && wordClone.definitions.length > 0){
            async.each(wordClone.definitions, function(def, done_callback_def){
                User.findOne({'_id': def.creator.user_id}, {'__v':0, 'password':0}, function (err, owner) {
                    
                    if (err) {
                        // Query returned an error.
                        console.error('Doing /user/:id error:', err);
                        response.status(400).send(JSON.stringify(err));
                        return;
                    }
                    // owner = JSON.parse(JSON.stringify(owner));
                    if(owner !== null && owner.created.length > 0){
                        for(var idx=0; idx<owner.created.length; idx++){
                            if(def._id.toString() === owner.created[idx]._id.toString()){
                                owner.created.splice(idx, 1);
                                owner.save();
                                
                            }
                        }
                    }
                });
                done_callback_def();
            }, function(err){
                if( err ) {
                  // One of the iterations produced an error.
                  // All processing will now stop.
                  console.log('A user def failed to delete');
                }
            });
            
            response.end(JSON.stringify("info"));

            // Now let's delete the actual wordgroup
            WordGroup.remove({_id: request.body.id}, function(err, info) {
            // hanlde err..
            if (err) {
                // Query returned an error.
                console.error('Doing deletion for wordGroup:', err);
                response.status(400).send(JSON.stringify(err));
                return;
            }
                response.end(JSON.stringify(info));
            });

        }
    });
});


// Deletes the specified definition from particular rootWord
app.post('/deleteDef', function(request, response){
    if ((!request.session.user_id) || (!request.session.userObj.role > 2)) {
        // no logged user, unauthorized
        console.error('Out of bounds - delete def');
        response.status(401).send(JSON.stringify("Out of bounds."));
        return;
    }

    WordGroup.findOne({_id: request.body.parent_id}, function(err, info) {
        // hanlde err..
        if (err) {
            // Query returned an error.
            console.error('Doing lookup for wordGroup:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        // If the word has only 1 def, delete entire word.
        if(info !== null && info.definitions.length === 1){

            User.findOne({'_id': info.definitions[0].creator.user_id}, {'__v':0, 'password':0}, function (err, owner) {
                if (err) {
                    // Query returned an error.
                    console.error('Doing /user/:id error:', err);
                    response.status(400).send(JSON.stringify(err));
                    return;
                }
                if(owner !== null && owner.created.length > 0){
                    for(var idx=0; idx<owner.created.length; idx++){
                        if(request.body._id === owner.created[idx]._id.toString()){

                            owner.created.splice(idx, 1);
                            owner.save();

                        }
                    }
                }
            });

            WordGroup.remove({_id: request.body.parent_id}, function(err, info) {
                // hanlde err..
                if (err) {
                    // Query returned an error.
                    console.error('Doing deletion for wordGroup:', err);
                    response.status(400).send(JSON.stringify(err));
                    return;
                }
                response.end(JSON.stringify(info));
                return;
            });
        }
        if(info !== null){    
            var tmpArr = JSON.parse(JSON.stringify(info));
            var todelfrom = tmpArr.definitions;
            for(var ind=0; ind<todelfrom.length; ind++){
                if(request.body._id === todelfrom[ind]._id.toString()){
                    
                    var d = todelfrom[ind];
                    User.findOne({'_id': d.creator.user_id}, {'__v':0, 'password':0}, function (err, owner) {
                        if (err) {
                            // Query returned an error.
                            console.error('Doing /user/:id error:', err);
                            response.status(400).send(JSON.stringify(err));
                            return;
                        }
                        if(owner !== null && owner.created.length > 0){
                            for(var idx=0; idx<owner.created.length; idx++){
                                if(request.body._id === owner.created[idx]._id.toString()){

                                    owner.created.splice(idx, 1);
                                    owner.save();

                                }
                            }
                        }
                    });

                    todelfrom.splice(ind,1);
                    info.definitions = todelfrom;
                    info.save();
                    response.end(JSON.stringify(info));
                    return;
                }
            }      
        }
    });
});

app.post('/addWord', function(request, response){
    if (!request.session.user_id) {
        // no logged user, unauthorized
        console.error('Not logged in, 401');
        response.status(401).send(JSON.stringify("Please login first."));
        return;
    }
    WordGroup.findOne({'wordname': request.body.word}, function(err, info) {
        // hanlde err..
        if (err) {
            // Query returned an error.
            console.error('Doing lookup for wordGroup:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (info !== null) {
            var info2 = JSON.parse(JSON.stringify(info));
            var d = new Definition({
                word: request.body.word,
                parent_id: info2._id,
                definition: request.body.definition,
                example: request.body.example,
                tags: request.body.tags,
                creator: {user_id: request.session.user_id, login_name: request.session.userObj.login_name},
                faved_by: []    // login_name of users who like this definition.
            });
            info.definitions.push(d);
            info.last_modified = Date.now();
            info.save();

            User.findOne({'_id': request.session.user_id}, {'__v':0, 'password':0}, function (err, currUser) {
                if (err) {
                    // Query returned an error.
                    console.error('Doing /user/:id error:', err);
                    response.status(400).send(JSON.stringify(err));
                    return;
                }
                if(currUser === null){
                    response.status(400).send(JSON.stringify("No such user!"));
                    return;
                }
                currUser.created.push(d);
                currUser.save();
            });
            response.end(JSON.stringify(info));
        }
        else {
            var d = new Definition({
                word: request.body.word,
                definition: request.body.definition,
                example: request.body.example,
                tags: request.body.tags,
                creator: {user_id: request.session.user_id, login_name: request.session.userObj.login_name},
                faved_by: []    // login_name of users who like this definition.
            });
            WordGroup.create({
                wordname: request.body.word,
                definitions: [d]
            }, function(err, newWordObj){
                if(err){
                    console.err("Error while creating new wordObj");
                }else{
                    newWordObj.definitions[0].parent_id = newWordObj._id;
                    newWordObj.save();

                    User.findOne({'_id': request.session.user_id}, {'__v':0, 'password':0}, function (err, currUser) {
                        if (err) {
                            // Query returned an error.
                            console.error('Doing /user/:id error:', err);
                            response.status(400).send(JSON.stringify(err));
                            return;
                        }
                        if(currUser === null){
                            console.error('Doing /user/:id error: No such user!');
                            response.status(400).send(JSON.stringify("No such user!"));
                            return;
                        }
                        currUser.created.push(newWordObj.definitions[0]);
                        currUser.save();
                    });
                    response.end(JSON.stringify(newWordObj));
                }
            });
        }
   });    
});

/*
* Search feature
*/
app.get('/search/:text', function(request, response){
    WordGroup.find({wordname: {$regex: request.params.text, $options: 'i'}, approved: true}, function(err, info){
        if (err) {
            // Query returned an error.
            console.error('searching error:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        response.end(JSON.stringify(info));
    })
});


/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    if ((!request.session.user_id) || (!request.session.userObj.role > 3)) {
        // no logged user, unauthorized
        console.error('Not logged in, 401');
        response.status(401).send(JSON.stringify("Please login first."));
        return;
    }

    User.find(request.body, {'__v':0, 'password':0}, function (err, info) {
        if (err) {
            // Query returned an error.  We pass it back to the browser with an Internal Service
            // Error (500) error code.
            console.error('Doing /user/list error:', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
        if (info === null || info.length === 0) {
            // Query didn't return an error but didn't find the SchemaInfo object - This
            // is also an internal error return.
            response.status(500).send('Missing SchemaInfo');
            return;
        }

        // We got the object - return it in JSON format.
        // console.log('User info - ', info);
        response.end(JSON.stringify(info));
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    var id = request.params.id;
    var filter = {'_id': id};
    // console.log("searching for user with filter ", filter);
    User.findOne(filter, {'__v':0, 'password':0}, function (err, info) {
        if (err) {
            // Query returned an error.
            console.error('Doing /user/:id error:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if(info === null){
            console.error('Doing /user/:id error: No such user!');
            response.status(400).send(JSON.stringify("No such user!"));
            return;
        }
        // We got the object - return it in JSON format.
        // console.log('User found in mongo - ', info);
        response.end(JSON.stringify(info));
    });
});

// Deals with login
app.post('/admin/login', function (request, response){
    var filter = {'login_name': request.body.login_name, 'password': PasswordMethods.makePasswordEntry(request.body.password)};
    User.findOne(filter, {}, function (err, info) {
        if (err) {
            // Query returned an error.
            console.error('Doing lookup for login_name:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        else if (info === null){
            response.status(400).send(JSON.stringify("Please check your login details."));
            response.end(JSON.stringify(info));
            return;
        }
        request.session.user_id=info._id;   // Store the session
        request.session.userObj = info;        
        response.end(JSON.stringify(info));
    });
});

app.post('/admin/logout', function (request, response){
    // clear the info stored in session
    if(!request.session.user_id){
        response.status(400).send(JSON.stringify("Not even logged in."));
        return;
    }
    request.session.destroy(function (err) {
        if(err){
            console.error('Clearing session state:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        response.end(JSON.stringify("successfully logged out"));
    });
});

/*
    Creates a new user account.
*/
app.post('/user', function (request, response) {
    // Create new user, but first check if the login_name already exists!
    User.findOne({'login_name': request.body.login_name}, function(err, user) {
        // hanlde err..
        if (err) {
            // Query returned an error.
            console.error('Doing lookup for login_name at user registration:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (user !== null) {
            // user already exists
            response.status(400).send(JSON.stringify("Login Name not unique."));
        } else {
            // user does not exist, so let's create it and return success message.
            var newUser = {login_name: request.body.login_name, password: PasswordMethods.makePasswordEntry(request.body.password)};
            if (request.body.login_name === "admin"){newUser.role = 5};
            User.create(newUser, function (err, userObj) {
                if (err) {
                    console.error('Error while creating user', err);
                } else {
                    // user.objectID = userObj._id;
                    request.session.userObj = userObj;
                    request.session.user_id = userObj._id;
                    response.end(JSON.stringify(userObj));
                }
            });
        }
   });    
});

///////////////////////////////////////////////////////////////////////////////

/* Favorite Definitions
*/
app.post('/favorite', function (request, response){
    if (!request.session.user_id) {
        // no logged user, unauthorized
        response.status(401).send(JSON.stringify("Please login first."));
        return;
    }

    User.findOne({'_id': request.session.user_id}, function(err, user) {
        // hanlde err..
        if (err) {
            // Query returned an error.
            console.error('Doing lookup for user at adding favorite:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (user !== null) {
            // user exists, let's update their favorited
            var currFav = JSON.parse(JSON.stringify(user.faved));
            for(var i=0; i<currFav.length; i++){
                if (currFav[i]._id === request.body.definition._id){
                    response.status(400).send(JSON.stringify("Already faved"));
                    return;
                }
            }
            user.faved.push(request.body.definition);
            user.save();
            // Add user to definition's faved_by[]
            WordGroup.findOne({_id: request.body.definition.parent_id}, function(err, wg) {
                if (err) {
                    // Query returned an error.
                    console.error('Doing lookup for wordGroup:', err);
                    response.status(400).send(JSON.stringify(err));
                    return;
                }
                if(wg === null || wg === undefined || wg.definitions.length === 0){
                    // response.status(400).send(JSON.stringify("Wordgroup is null or empty"));
                    return;
                }
                var w2 =  JSON.parse(JSON.stringify(wg));
                for(var j=0; j<w2.definitions.length; j++){
                    if (w2.definitions[j]._id === request.body.definition._id){
                        if(w2.definitions[j].faved_by.indexOf(user._id) === -1){
                            wg.definitions[j].faved_by.push(user._id);
                            wg.save();
                        }
                    }
                }
            });
            response.end(JSON.stringify("success"));
            return;
        }
    });    
});


app.post('/unfavorite', function(request, response){
    if (!request.session.user_id) {
        // no logged user, unauthorized
        response.status(401).send(JSON.stringify("Please login first."));
        return;
    }
    var def = request.body.definition;
    // Remove def from faved[] of User
    User.findOne({'_id': request.session.user_id}, function(err, user) {
        // hanlde err..
        if (err) {
            // Query returned an error.
            console.error('Doing lookup for user at adding favorite:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (user !== null) {
            // user exists, let's update their favorited
            var favOfUser = JSON.parse(JSON.stringify(user.faved));
            for(var i=0; i<favOfUser.length; i++){
                if (favOfUser[i]._id === request.body.definition._id){
                    favOfUser.splice(i, 1);
                }
            }
            user.faved = favOfUser;
            user.save();
        }
        // Remove user._id from WordGroup --> definitions[] --> faved_by[]
        WordGroup.findOne({_id: request.body.definition.parent_id}, function(err, wg) {
            if (err) {
                // Query returned an error.
                console.error('Doing lookup for wordGroup:', err);
                response.status(400).send(JSON.stringify(err));
                return;
            }
            if (wg !== null) {
                var w2 =  JSON.parse(JSON.stringify(wg));
                for(var j=0; j<w2.definitions.length; j++){
                    if (w2.definitions[j]._id === request.body.definition._id){
                        var indexOfInterest = w2.definitions[j].faved_by.indexOf(user._id.toString());
                        if(indexOfInterest > -1){
                            w2.definitions[j].faved_by.splice(indexOfInterest, 1);
                            wg.definitions[j] = w2.definitions[j];
                            wg.save();
                        }
                    }
                }
            }
        });
        response.end(JSON.stringify("success"));
    });
});

///////////////////////////////////////////////////////////////////////////////
/* ADMIN ONLY APIs
*  
*/

// Deletes the user from Mongo
app.post('/deleteUser', function(request, response){
    if ((!request.session.user_id) || (!request.session.userObj.role > 4)) {
        // no logged user, unauthorized
        console.error('Out of bounds - delete word');
        response.status(401).send(JSON.stringify("Out of bounds."));
        return;
    }

    User.remove({_id: request.body.id}, function(err, info) {
        // hanlde err..
        if (err) {
            // Query returned an error.
            console.error('Doing deletion for user:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        response.end(JSON.stringify(info));
    });
});



// Update the user's auth role
app.post('/updateUser', function(request, response){
    if ((!request.session.user_id) || (!request.session.userObj.role > 4)) {
        // no logged user, unauthorized
        console.error('Out of bounds - delete word');
        response.status(401).send(JSON.stringify("Out of bounds."));
        return;
    }

    User.findOne({_id: request.body.id}, function(err, info) {
        // hanlde err..
        if (err) {
            // Query returned an error.
            console.error('Doing deletion for wordGroup:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if(info === null || info === undefined){
            console.error('No such user', err);
            response.status(400).send(JSON.stringify("no such user."));
            return;
        }

        info.role = request.body.newRole;
        info.save();
        response.end(JSON.stringify(info));
    });
});


///////////////////////////////////////////////////////////////////////////////

// var server = app.listen(3000, function () {
//     var port = server.address().port;
//     console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
// });

app.set('port', (process.env.PORT || 3000));


// views is directory for all template files
// app.set('views', __dirname + '/views');
// app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('index')
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});