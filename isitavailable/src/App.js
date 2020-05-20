import React, { useState, useEffect } from "react";
import {
  withGoogleMap,
  withScriptjs,
  GoogleMap,
  Marker,
  InfoWindow 
} from "react-google-maps";
import POIs from "./data/POIs.json"

//import mapStyles from "./mapStyles";

function RawMap() {
  const [selectedPOI, setSelected] = useState(null);

  return (
    <GoogleMap
      defaultZoom={15.5}
      defaultCenter={{lat : 34.069, lng: -118.445}} //start at UCLA for now
    >
        {POIs.map(place => 
        (<Marker
          key = {place.NAME}
          position = {{lat: place.COORDINATES[0], lng: place.COORDINATES[1]}}
          onClick = {() => setSelected(place)}/>)
          )}
          {selectedPOI && //boolean "trick" used here - might want to change to something a bit less cryptic in the future
          <InfoWindow
            position = {{lat: selectedPOI.COORDINATES[0], lng: selectedPOI.COORDINATES[1]}}
            onCloseClick = {() => setSelected(null)}
            >
              <div>
                <h2>{selectedPOI.NAME}</h2>
                <p>{selectedPOI.DESCRIPTION}</p>
              </div>
          </InfoWindow>
          }
    </GoogleMap>
  );
}


const Map = withScriptjs(withGoogleMap(RawMap));

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Map
        googleMapURL={`https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places&key=${
          process.env.REACT_APP_GOOGLE_KEY
        }`}

        //googleMapURL={`https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places`}
        loadingElement={<div style={{ height: `100%` }} />}
        containerElement={<div style={{ height: `100%` }} />}
        mapElement={<div style={{ height: `100%` }} />}
      />
    </div>
  );
}
