import React, { useState, useEffect } from "react";
import {
  withGoogleMap,
  withScriptjs,
  GoogleMap,
  //Marker,
  //InfoWindow
} from "react-google-maps";
//import mapStyles from "./mapStyles";

function Map() {
  return (
    <GoogleMap
      defaultZoom={10}
      defaultCenter={{lat : 34.069, lng: -118.445}}
    />
  );
}


const MapWrapped = withScriptjs(withGoogleMap(Map));

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <MapWrapped
        googleMapURL={`https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places&key=${
          "AIzaSyCLQoz-tl2amrxg2CISg0RxxDaFjWeHpUE"
        }`}

        //googleMapURL={`https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places`}
        loadingElement={<div style={{ height: `100%` }} />}
        containerElement={<div style={{ height: `100%` }} />}
        mapElement={<div style={{ height: `100%` }} />}
      />
    </div>
  );
}
