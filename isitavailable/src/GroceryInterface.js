import React from "react";
import Button from 'react-bootstrap/Button';
import firebase from './firebase.js';
import { Combobox, ComboboxInput } from "@reach/combobox";
import { ItemWidget } from "./ItemWidget";

const itemIcons = {"eggs": "eggs.jpg", "beans": "beans.jpg", "bread": "bread.jpg", "chicken": "chicken.jpg", "toilet_paper": "toilet_paper.jpg",
"fish": "fish.jpg", "flour": "flour.jpg", "milk": "milk.jpg", "pasta": "pasta.jpg", "rice": "rice.jpg", "water": "water.jpg"};

export class GroceryInterface extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchVal: '',
      images: [],
      customInput: '',
      storeID: ''
    };
  }
  getDBName(name){
    return name.replace(/\s/g, "_").toLowerCase();
  }

  getItems() {
    const storesRef = firebase.database().ref('stores');
    storesRef.on('value', snap => {
      let stores = snap.val();
      let itemImagePairs = [];
      for (let store in stores) {
        if (this.props.location.lat === stores[store].lat && this.props.location.lng === stores[store].long) {
          //console.log("store is: " + stores[store].name);
          if(store !== this.state.storeID){
            this.setState({storeID: store});
          }
          let items = stores[store].items;
          for (let item in items) {
            let i = {
              name: item,
              src: itemIcons.hasOwnProperty(item) ? itemIcons[item] : "grocery.png"
            };
            itemImagePairs.push(i);
          }
          if (Object.keys(this.state.images).length !== Object.keys(itemImagePairs).length) {
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
  handleCustomChange(e){
    this.setState({ customInput: e.target.value });
  }
  
  addCustomItem(){
    const storesRef = firebase.database().ref('stores');
    const itemsRef = firebase.database().ref('items');
    let customItem = this.getDBName(this.state.customInput);
    itemsRef.once('value', snap => {
      let items = snap.val();
      for(let item in items){
        if(items[item].item === customItem){
          //console.log("already a valid item");
          return;
        }
      }
      let itemData = {
        item: customItem
      };
      var newPostKey = firebase.database().ref().child('posts').push().key;
      console.log("writing to db");
      firebase.database().ref().child('/items/' + newPostKey).set(itemData);
    });

    storesRef.once('value', snap => {
      let stores = snap.val();
      let items = stores[this.state.storeID].items;
      for(let item in items){
        if(item === customItem){
          //console.log("item is already in this store");
          return;
        }
      }
      let itemData = {
        status: -1
      };
      //console.log("writing to db");
      firebase.database().ref().child('/stores/' + this.state.storeID + '/items/' + customItem).set(itemData);
    });
    this.setState({customInput: ''});
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
      <label className = "mr-2">
        Add a custom item:
      </label>
      <input value={this.state.customInput} className='customInputBar mr-2' type="text" onChange={e => this.handleCustomChange(e)}/>
      <Button onClick={()=>this.addCustomItem()} >Add</Button>
      
    </div>);
  }
}
