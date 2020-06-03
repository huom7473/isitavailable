import firebase from './firebase.js';
export function LoadLocation(newName, latitude, longitude, storeType) {
  //console.log("LAT: " + latitude);
  let isGrocery = false;
  const itemsRef = firebase.database().ref('stores');
  itemsRef.once('value', snap => {
    let items = snap.val();
    let newState = [];
    for (let item in items) {
      if (items[item].lat === latitude && items[item].long === longitude) {
        //console.log("already in db!");
        return;
      }
    }
    let itemData;
    //console.log("not in db yet");
    if (storeType === 'G') {
      itemData = {
        eggs: {status: 0},
        milk: {status: 0},
        rice: {status: 0},
        flour: {status: 0},
        chicken: {status: 0},
        pasta: {status: 0},
        water: {status: 0},
        beans: {status: 0},
        bread: {status: 0},
        fish: {status: 0},
      };
      isGrocery = true;
    }
    let postData = {
      name: newName,
      lat: latitude,
      long: longitude,
    };
    var newPostKey = firebase.database().ref().child('posts').push().key;
    //console.log("writing to db");
    firebase.database().ref().child('/stores/' + newPostKey).set(postData);
    if (isGrocery) {
      firebase.database().ref().child('/stores/' + newPostKey + '/items').set(itemData);
    }
    //console.log("exiting loadlocation function");
  });
}
