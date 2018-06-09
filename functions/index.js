// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
//const moment = require('moment');
const moment = require('moment-timezone');

moment.tz.setDefault("Pacific/Auckland");

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

//const userFields = { "CYCClass" : ["speaker","chair","hosts", "supper"], "CYCActivity": ["hosts", "organisers"]}

exports.notifyUsers = functions.database.ref('/plans/{ecclesiaId}/{year}/{date}/{eventid}/')
    .onWrite((change, context) => {
      // Grab the current value of what was written to the Realtime Database.
      const beforeData = change.before.val(); 
      const afterData = change.after.val();

      // You must return a Promise when performing asynchronous tasks inside a Functions such as
      // writing to the Firebase Realtime Database.
      // Setting an "uppercase" sibling in the Realtime Database returns a Promise.

      if(afterData !== null && isDateInWeek(context.params.date)) {
        console.log("Will notify")
        checkIfNotificationNeeded(beforeData, afterData, context.params.ecclesiaId, context.params.eventid, context.params.date)
      } else {
        console.log("No need to notify")
      }

      return true
});

function checkIfNotificationNeeded(beforeData, afterData, ecclesiaId, eventId, date){
    if (beforeData.venue !== afterData.venue){
        console.log("will notify")
        sendNotification(ecclesiaId, eventId, afterData.venue, date)
    }
}

function isDateInWeek(dateString) {
    var eventDate = moment(dateString, 'DD-MM-YYYY');
    var currentDate = moment()
    currentDate;
    let isSameWeek = moment(eventDate).isSame(currentDate, 'week');
    return isSameWeek;
}

function sendNotification(topic, eventId, newVenue, date){

    // See documentation on defining a message payload.

    var message = {
        notification: {
          title: 'Change to the plan',
          body: 'CYC this week is now at ' + newVenue,
        },
        android: {
          ttl: 3600 * 1000,
          notification: {
            icon: 'stock_ticker_update',
            color: '#f45342',
          },
        },
        apns: {
          payload: {
            aps: {
              badge: 0,
              sound: "ping.aiff"
            },
            data: {"eventId": eventId,
                    "eventDate": date
            }
          },
        },
        topic: topic
      };

    // Send a message to devices subscribed to the provided topic.
    admin.messaging().send(message)
    .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
    })
    .catch((error) => {
        console.log('Error sending message:', error);
    });
}

// function findUserIdsForNames(event, ecclesiaId){
//     for(let i = 0; i < userFields[event.type].length; i++){
//         let userType = userFields[event.type][i]

//         if (event[userType].name !== null){
//             console.log(event[userType].name)
//             findIdForName(event[userType].name, ecclesiaId)
//         } else {
//             console.log("not single" + event[userType])
//             let userArray = event[userType]
//             for(let j = 0; j < userArray.length; j++){
//                 console.log(userArray[j].name)
//             }
//         }
//     }
// }

// function findIdForName(name, ecclesiaId){
//     admin.database().ref('/members/' + ecclesiaId).once('value').then(function(snapshot) {
//         let members = snapshot.val()
//         for(let i = 0; i < members.length; i++){
//             if((_.invert(hash))[name] !== null){
//                 console.log((_.invert(hash))[name])
//             }
//         }
//     });
// }