import "@reach/combobox/styles.css";
import { useLoadScript } from "@react-google-maps/api";
import 'bootstrap/dist/css/bootstrap.css';
import React from "react";
import Button from 'react-bootstrap/Button';
import { LoadLocation } from "./LoadLocation";
import { Map, defaultZoom } from "./Map";
import { Search } from "./Search";
import { Sidebar } from "./Sidebar";

const icons = {"R": "restaurant.svg", "G": "grocery.png"};

const libraries = ["places"];

export default function App() {
   
    const {isLoaded, loadError} = useLoadScript({
      googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      libraries: libraries
    })

    var markers = [];
    
    let mapRef;
    const onLoad = React.useCallback((map) => {
      mapRef = map;
      loadMarkers([{keyword: "groceries", iconName: "G"}, {keyword: "restaurants", iconName: "R"}]);
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
      for(let i = 0; i < markers.length; i++){
        markers[i].setMap(null);
      }
      markers = [];
    }, [])

    const loadMarkers = React.useCallback((keypairs) => {
      const center = mapRef.getCenter();
      const proxyurl = "https://cors-anywhere.herokuapp.com/";
      setPOISLoading(true);

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
            markers.push(marker);
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
      //console.log({lat, lng});
      mapRef.panTo({lat, lng});
      smoothZoom(mapRef.getZoom(), defaultZoom);
      loadMarkers([{keyword: "groceries", iconName: "G"}, {keyword: "restaurants", iconName: "R"}]);
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
          <Button variant="danger" onClick={removeMarkers}>Clear POIs</Button>
        </span>
        <Search pan={pan}/>
        <Map onLoad={onLoad}/>
      </div>
    );
}


