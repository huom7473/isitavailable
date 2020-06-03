import React from "react";
import firebase from './firebase.js';
import { Combobox, ComboboxInput } from "@reach/combobox";
import { ItemWidget } from "./ItemWidget";

const itemIcons = {"eggs": "https://cdn.vox-cdn.com/thumbor/TGJMIRrhzSrTu1oEHUCVrizhYn0=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/13689000/instagram_egg.jpg", 
"milk": "https://hq.recyclist.co/wp-content/uploads/2015/02/milkgallon-300x300.jpg", "rice" : "https://d2d8wwwkmhfcva.cloudfront.net/800x/d2lnr5mha7bycj.cloudfront.net/product-image/file/large_7e52a534-621e-4aea-b085-845b5f5e2c01.jpg",
"flour": "https://nuts.com/images/rackcdn/ed910ae2d60f0d25bcb8-80550f96b5feb12604f4f720bfefb46d.ssl.cf1.rackcdn.com/c08b4a59c098d141-tZqCb-IE-zoom.jpg", "chicken": "https://www.marlerblog.com/uploads/image/chicken_1823798c.jpg",
"pasta": "https://assets.tmecosys.com/image/upload/t_web767x639/img/recipe/ras/Assets/6F320FC7-CBD7-419D-B790-24DA25E975F9/Derivates/9774C36E-8478-4BE3-A8CD-FF02AC5B9BCB.jpg", "beans" : "https://images-na.ssl-images-amazon.com/images/I/81jSxkIyr%2BL._SY550_.jpg",
"water": "https://ik.imagekit.io/ontimesupplies/oppictures/images/180489.JPG?tr=w-1500", "fish": "https://jpg.westernkosher.com/content/images/thumbs/0055127_fresh-fish_300.jpeg", "bread": "https://bakingamoment.com/wp-content/uploads/2020/01/IMG_7173-white-bread-2.jpg"
}

export class GroceryInterface extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchVal: '',
      images: []
    };
  }
  getItems() {
    const pineapple_url = "https://images-na.ssl-images-amazon.com/images/I/71%2BqAJehpkL._SL1500_.jpg";
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
              src: itemIcons.hasOwnProperty(item) ? itemIcons[item] : "https://images-na.ssl-images-amazon.com/images/I/71%2BqAJehpkL._SL1500_.jpg"
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
