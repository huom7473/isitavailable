import React from "react";
import firebase from './firebase.js';
import { Combobox, ComboboxInput } from "@reach/combobox";
import { ItemWidget } from "./ItemWidget";

export class GroceryInterface extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchVal: '',
      images: []
    };
  }
  getItems() {
    const storesRef = firebase.database().ref('stores');
    storesRef.on('value', snap => {
      let stores = snap.val();
      let itemImagePairs = [];
      for (let store in stores) {
        if (this.props.location.lat === stores[store].lat && this.props.location.lng === stores[store].long) {
          //console.log("store is: " + stores[store].name);
          let items = stores[store].items;
          for (let item in items) {
            let i = {
              name: item,
              src: "" + item + ".jpg"
            };
            itemImagePairs.push(i);
          }
          if (Object.keys(this.state.images).length != Object.keys(itemImagePairs).length) {
            //console.log("not the same!");
            this.setState({
              images: itemImagePairs
            });
          }
        }
      }
    });
  }
  handleChange(e) {
    //console.log(e.target.value);
    this.setState({ searchVal: e.target.value });
  }
  render() {
    this.getItems();
    var widgets = this.state.images.map(desc => {
      return (desc.name.includes(this.state.searchVal) ?
        <ItemWidget key={desc.name} location={this.props.location} itemName={desc.name} src={desc.src} /> : null);
    });
    if (widgets.every(v => !v)) { //if all entries in widgets are null (i.e. no items match filter)
      widgets = "No items match your search. Try another one.";
    }
    return (<div>
      <Combobox aria-labelledby="searchbox">
        <ComboboxInput id="filterInput" onChange={e => this.handleChange(e)} placeholder="Filter items..." />
      </Combobox>
      <br /> <br />
      {widgets}
    </div>);
  }
}
