import "@reach/combobox/styles.css";

import { useLoadScript } from "@react-google-maps/api";
import 'bootstrap/dist/css/bootstrap.css';
import React from "react";
import Button from 'react-bootstrap/Button';
import { LoadLocation } from "./LoadLocation";
import { Map, defaultZoom } from "./Map";
import { Search } from "./Search";
import { Sidebar } from "./Sidebar";
import { ItemSearch } from "./ItemSearch";

const icons = {"R": "restaurant.svg", "G": "grocery.png"};

const libraries = ["places"];
var markers = [];
global.markers = markers;

export default function App() {
    const {isLoaded, loadError} = useLoadScript({
      googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      libraries: libraries
    })

    let mapRef;
    const onLoad = React.useCallback((map) => {
      mapRef = map;
      let startLat, startLng;
      if("geolocation" in navigator){
        console.log("geolocating");
        navigator.geolocation.getCurrentPosition(position => {
          startLat = position.coords.latitude;
          startLng = position.coords.longitude;
          //console.log(startLat + ' '+ startLng);
          pan({lat: startLat, lng: startLng});
        }, () => loadMarkers([{keyword: "groceries", iconName: "G"}, {keyword: "restaurants", iconName: "R"}])
      )}
      else {
        loadMarkers([{keyword: "groceries", iconName: "G"}, {keyword: "restaurants", iconName: "R"}]);
      }
      
    }, []);

    const [open, setOpen] = React.useState(false);
    const [selectedPOI, setPOI] = React.useState(null);
    const [POIsLoading, setPOISLoading] = React.useState(false);

    const smoothZoom = (current, end) => {
      //console.log("starting from", current);
      while (current < end) {
        setTimeout(() => {
          //console.log("setting zoom to", current + 1);
          mapRef.setZoom(current + 1);
        }, 1000);
        current++;
      }
    }

    const removeMarkers = React.useCallback(() => {
      //console.log(markers);
      for(let i = 0; i < global.markers.length; i++){
        global.markers[i].setMap(null);
      }
      global.markers = [];
    }, [])


    const resetMarkers = React.useCallback(() => {
      //console.log(markers);
      //console.log(global.markers[0].getIcon());
      for(let i = 0; i < markers.length; i++){
        global.markers[i].setMap(mapRef);

        if(global.markers[i].icon.url !== icons["R"]){
          global.markers[i].icon.url = icons["G"];
          global.markers[i].setIcon(global.markers[i].getIcon()); //bandaid fix to force update because too lazy to do it the "correct" way :P
        }
      }
    }, [])


   

    const loadMarkers = React.useCallback((keypairs) => {
      const center = mapRef.getCenter();
      const proxyurl = "http://localhost:8080/";
      setPOISLoading(true);

      for(let i = 0; i < keypairs.length; i++) { //handles multiple keywords
        const keyword = keypairs[i].keyword;
        const iconName = keypairs[i].iconName;
        //console.log('load markers call:' + center.lat()+' '+center.lng());
        fetch(proxyurl+
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key="
        +process.env.REACT_APP_GOOGLE_MAPS_API_KEY+
        "&location="+center.lat() + "," + center.lng()+
        "&keyword="+keyword+"&rankby=distance")
        .then(response => response.json())
        .then(results => {
          for(let i = 0; i < results.results.length; i++){
            results.results[i].typeShort = iconName;
            var marker = new window.google.maps.Marker({
              position: results.results[i].geometry.location,
              map: mapRef,
              icon: {
                url: icons[iconName],
                scaledSize: new window.google.maps.Size(40, 40),
                origin: new window.google.maps.Point(0,0),
                anchor: new window.google.maps.Point(20, 20)}
            });
            marker.addListener('click', (event) => {
              LoadLocation(results.results[i].name, results.results[i].geometry.location.lat, results.results[i].geometry.location.lng, iconName);
              results.results[i].typeShort = iconName;
              setPOI(results.results[i]);
              //console.log(results.results[i])
              setOpen(true);
            });
            global.markers.push(marker);
            //console.log("number of markers: " + Object.keys(global.markers).length);
            // if(Object.keys(global.markers).length === 40 || Object.keys(global.markers).length === 20){
            //   for(let val in global.markers){
            //     console.log("lat: " + global.markers[val].position.lng());
            //   }
            // }

          }
        })
        .then(() => {
          if(i === keypairs.length - 1) { //only set the loading state of the button to false after last iteration
            setPOISLoading(false);
          }
        })
        .catch((error) => {
          console.error(error)
        })
      }
      
    }, [])

    const pan = React.useCallback(({lat, lng}) => {
      mapRef.panTo({lat, lng});
      smoothZoom(mapRef.getZoom(), defaultZoom);
      //console.log(mapRef.getCenter().lat() + ' ' + mapRef.getCenter().lng());
      setTimeout(() => loadMarkers([{keyword: "groceries", iconName: "G"}, {keyword: "restaurants", iconName: "R"}]), 1000);
    }, [])

    if (loadError) return "Maps failed to load. Please try again later or check connection.";
    if (!isLoaded) return "Loading maps...";

    return (
      <div>
        {selectedPOI && <Sidebar isOpen={open} osc={state => setOpen(state.isOpen)} selected={selectedPOI}/>}
        <span className="POIManagement">
          <Button 
            variant="info" 
            className="mr-2" 
            onClick={() => loadMarkers([{keyword: "groceries", iconName: "G"}, {keyword: "restaurants", iconName: "R"}])}
            disabled={POIsLoading}
            >
              {POIsLoading ? 'Loading...' : 'Load Nearby POIs'}
            </Button>
          <Button variant="danger" className="mr-2" onClick={removeMarkers}>Clear POIs</Button>
          
        </span>

        <Button className="ResetButton" variant="info" onClick={resetMarkers}>Reset Markers</Button>

        <Search pan={pan}/>
        <Map onLoad={onLoad}/>
        <ItemSearch />
      </div>
    );
}


