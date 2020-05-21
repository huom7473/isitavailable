import React from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import POIs from "./data/POIs.json"
import mapTheme from "./mapTheme.js"

const icons = {"R": "restaurant.svg", "G": "grocery.png"};

const libraries = ["places"];
const mapContainerStyles = {
  width: "100vw",
  height: "100vh",
};
const defaultCenter = {lat : 34.069, lng: -118.445};
const defaultZoom = 15.5;
const options = {styles: mapTheme}

function Map() {
  const [selectedPOI, setSelected] = React.useState(null);

  return (
    <GoogleMap 
          mapContainerStyle={mapContainerStyles}
          zoom={defaultZoom}
          center={defaultCenter}
          options = {options}>
        {POIs.map(place => 
        (<Marker
          key = {place.NAME}
          position = {{lat: place.COORDINATES[0], lng: place.COORDINATES[1]}}
          onClick = {() => setSelected(place)}
          icon = {{
            url: icons[place.TYPE],
            scaledSize: new window.google.maps.Size(40, 40)}}
          />)
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



export default function App() {
    const {isLoaded, loadError} = useLoadScript({
      googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      libraries: libraries
    })

    if (loadError) return "Maps failed to load. Please try again later or check connection.";
    if (!isLoaded) return "Loading maps...";

    return (
      <div>
        <Map/>
      </div>
    );
}
