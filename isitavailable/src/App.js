import React from "react";
import firebase from './firebase.js'
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";

import "@reach/combobox/styles.css";

import mapTheme from "./mapTheme.js"

const icons = {"R": "restaurant.svg", "G": "grocery.png"};

const libraries = ["places"];
const mapContainerStyles = {
  width: "100vw",
  height: "100vh",
};
const defaultCenter = {lat : 34.069, lng: -118.445};
const defaultZoom = 15.5;
const options = {
  styles: mapTheme,
  disableDefaultUI: true,
  clickableIcons: false
}

class Map extends React.Component {
  constructor(props){
    super(props);
    this.state = {selectedPOI: null};
  }

  render() {

    return (
      <GoogleMap 
            mapContainerStyle={mapContainerStyles}
            zoom={defaultZoom}
            center={defaultCenter}
            options={options}
            onLoad={this.props.onLoad}>
      </GoogleMap>
    );
    }
}

export default function App() {
   
    const {isLoaded, loadError} = useLoadScript({
      googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      libraries: libraries
    })

    let mapRef;
    const onLoad = React.useCallback((map) => {
      mapRef = map;
      loadMarkers([{keyword: "groceries", iconName: "G"}, {keyword: "restaurants", iconName: "R"}]);
    }, []);

    var markers = [];

    const smoothZoom = (current, end) => {
      console.log("starting from", current);
      while (current < end) {
        setTimeout(() => {
          console.log("setting zoom to", current + 1);
          mapRef.setZoom(current + 1);
        }, 1000);
        current++;
      }
    }

    const removeMarkers = React.useCallback(() => {
      console.log(markers);
      for(let i = 0; i < markers.length; i++){
        markers[i].setMap(null);
      }
      markers = [];
    }, [])

    const loadMarkers = (keypairs) => {
      const center = mapRef.getCenter();
      const proxyurl = "https://cors-anywhere.herokuapp.com/";
      for(let i = 0; i < keypairs.length; i++) { //handles multiple keywords
        const keyword = keypairs[i].keyword;
        const iconName = keypairs[i].iconName;
        fetch(proxyurl+
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key="
        +process.env.REACT_APP_GOOGLE_MAPS_API_KEY+
        "&location="+center.lat() + "," + center.lng()+
        "&radius=10000&keyword="+keyword)
        .then(response => response.json())
        .then(results => {
          for(let i = 0; i < results.results.length; i++){
            var marker = new window.google.maps.Marker({
              position: results.results[i].geometry.location,
              map: mapRef,
              icon: {
                url: icons[iconName],
                scaledSize: new window.google.maps.Size(40, 40),
                origin: new window.google.maps.Point(0,0),
                anchor: new window.google.maps.Point(20, 20)}
            });
            marker.addListener('click', (event) => LoadLocation(results.results[i].name, results.results[i].geometry.location.lat, results.results[i].geometry.location.lng, results.results[i].types));
            markers.push(marker);
          }
        })
        .catch((error) => {
          console.error(error)
        })
      }
      
    }

    const pan = React.useCallback(({lat, lng}) => {
      console.log({lat, lng});
      mapRef.panTo({lat, lng});
      smoothZoom(mapRef.getZoom(), defaultZoom);
      loadMarkers([{keyword: "groceries", iconName: "G"}, {keyword: "restaurants", iconName: "R"}]);
    }, [])

    if (loadError) return "Maps failed to load. Please try again later or check connection.";
    if (!isLoaded) return "Loading maps...";

    return (
      <div>
        <button className="removeButton" onClick={removeMarkers}>Clear POIs</button>
        <Search pan={pan}/>
        <Map onLoad={onLoad}/>
      </div>
    );
}

function LoadLocation(newName, latitude, longitude, storeType){

  console.log("LAT: " + latitude);

  const itemsRef = firebase.database().ref('stores') 
  itemsRef.on('value', snap => {
    let items = snap.val();
    let newState = [];
    for(let item in items) {
      if(items[item].lat === latitude && items[item].long === longitude){
        console.log("already in db!");
        return;
      }
    }

    var itemData;
    console.log("not in db yet");
    for (let items in storeType){
    
    if(storeType[items].includes("grocery")){
      
      itemData = {
        eggs: -1,
        milk: -1,
      }
      break;
    } 
    else if (storeType[items].includes("restaurant")){
      itemData = {
        open: -1,
      } 
      break;
    }
    else {
      itemData = {
        noItems: 0,
      } 
    }
  }

  var postData = {
    name: newName,
    lat: latitude,
    long: longitude,
  };

  var newPostKey = firebase.database().ref().child('posts').push().key;

  console.log("writing to db");
  firebase.database().ref().child('/stores/' + newPostKey).set(postData);
  firebase.database().ref().child('/stores/' + newPostKey + '/items').set(itemData);
  console.log("exiting loadlocation function");
  return;

  });
  

  
}


function Search({ pan }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat : () => 34.069, lng: () => -118.445 },
      radius: 100 * 1000,
    },
  });
  
  const handleInput = (e) => {
    setValue(e.target.value);
  };
 
  const handleSelect = (description) => {
    setValue(description, false);
    clearSuggestions();

    getGeocode({ address: description })
      .then(results => getLatLng(results[0]))
      .then(({ lat, lng }) => {
        pan({lat, lng});
      }).catch(error => {
        console.log(error)
      });
  };
 
  const handleKeyPress = (event) => {
    if(event.key === 'Enter'){
      handleSelect(value);
    }
  }

  return (
    <div className = "search">
      <Combobox onSelect={handleSelect} aria-labelledby="searchbox" onKeyPress={handleKeyPress}>
        <ComboboxInput value={value} onChange={handleInput} disabled={!ready} placeholder="Search for a place..."/>
        <ComboboxPopover>
          <ComboboxList>
            {status === "OK" &&
              data.map(({ id, description, structured_formatting: { main_text, secondary_text } }) => (
                <ComboboxOption key={id} value={description}>
                  <div>
                    <font size={3}><b>{main_text}</b> <small>{secondary_text}</small></font>
                  </div>
                </ComboboxOption>
              ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  );
}
