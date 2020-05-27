import React from "react";
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
import { formatRelative } from "date-fns";

import "@reach/combobox/styles.css";

import POIs from "./data/POIs.json"
import mapTheme from "./mapTheme.js"
import { JsxEmit } from "typescript";

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
          {POIs.map(place => 
          (<Marker
            key = {place.COORDINATES}
            position = {{lat: place.COORDINATES[0], lng: place.COORDINATES[1]}}
            onClick = {() => this.setState({selectedPOI: place})}
            icon = {{
              url: icons[place.TYPE],
              scaledSize: new window.google.maps.Size(40, 40),
              origin: new window.google.maps.Point(0,0),
              anchor: new window.google.maps.Point(20, 20)}}
            />)
            )}
            {this.state.selectedPOI && //boolean "trick" used here - might want to change to something a bit less cryptic in the future
            <InfoWindow
              position = {{lat: this.state.selectedPOI.COORDINATES[0], lng: this.state.selectedPOI.COORDINATES[1]}}
              onCloseClick = {() => this.setState({selectedPOI: null})}
              onUnmount = {() => this.setState({selectedPOI: null})}
              >
                <div>
                  <h2>{this.state.selectedPOI.NAME}</h2>
                  <p>{this.state.selectedPOI.DESCRIPTION}</p>
                </div>
            </InfoWindow>
            }
      </GoogleMap>
    );
    }
}

export default function App() {
   
    const {isLoaded, loadError} = useLoadScript({
      googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      libraries: libraries
    })

    const mapRef = React.useRef();
    
    const onLoad = React.useCallback((map) => {
      mapRef.current = map;
    }, []);

    const smoothZoom = (current, end) => {
      console.log("starting from", current);
      while (current < end) {
        setTimeout(() => {
          console.log("setting zoom to", current + 1);
          mapRef.current.setZoom(current + 1);
        }, 1000);
        current++;
      }
    }

    const pan = React.useCallback(({lat, lng}) => {
      mapRef.current.panTo({lat, lng});
      smoothZoom(mapRef.current.getZoom(), defaultZoom);
    }, [])

    if (loadError) return "Maps failed to load. Please try again later or check connection.";
    if (!isLoaded) return "Loading maps...";

    return (
      <div>
        <Search pan={pan}/>
        <Map onLoad={onLoad}/>
      </div>
    );
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
        console.log("panning to ", { lat, lng });
        pan({lat, lng});
      }).catch(error => {
        console.log(error)
      });
  };
 
  return (
    <div className = "search">
      <Combobox onSelect={handleSelect} aria-labelledby="searchbox">
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
