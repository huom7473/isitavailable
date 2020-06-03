import React from "react";
import { GoogleMap } from "@react-google-maps/api";
import mapTheme from "./mapTheme.js";

const mapContainerStyles = {
    width: "100vw",
    height: "100vh",
  };
const defaultCenter = {lat : 34.069, lng: -118.445};
export const defaultZoom = 15.5;
const options = {
    styles: mapTheme,
    disableDefaultUI: true,
    clickableIcons: false
};

export class Map extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (<GoogleMap mapContainerStyle={mapContainerStyles} zoom={defaultZoom} center={defaultCenter} options={options} onLoad={this.props.onLoad}>
    </GoogleMap>);
  }
}
