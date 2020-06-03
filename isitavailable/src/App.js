import React from "react";
import firebase from './firebase.js'
import Button from 'react-bootstrap/Button'
import { slide as Menu } from 'react-burger-menu'
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

import "@reach/combobox/styles.css";
import 'bootstrap/dist/css/bootstrap.css';
import mapTheme from "./mapTheme.js"

const icons = {"R": "restaurant.svg", "G": "grocery.png"};

const itemIcons = {"eggs": "https://cdn.vox-cdn.com/thumbor/TGJMIRrhzSrTu1oEHUCVrizhYn0=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/13689000/instagram_egg.jpg", 
"milk": "https://hq.recyclist.co/wp-content/uploads/2015/02/milkgallon-300x300.jpg", "rice" : "https://d2d8wwwkmhfcva.cloudfront.net/800x/d2lnr5mha7bycj.cloudfront.net/product-image/file/large_7e52a534-621e-4aea-b085-845b5f5e2c01.jpg",
"flour": "https://nuts.com/images/rackcdn/ed910ae2d60f0d25bcb8-80550f96b5feb12604f4f720bfefb46d.ssl.cf1.rackcdn.com/c08b4a59c098d141-tZqCb-IE-zoom.jpg", "chicken": "https://www.marlerblog.com/uploads/image/chicken_1823798c.jpg",
"pasta": "https://assets.tmecosys.com/image/upload/t_web767x639/img/recipe/ras/Assets/6F320FC7-CBD7-419D-B790-24DA25E975F9/Derivates/9774C36E-8478-4BE3-A8CD-FF02AC5B9BCB.jpg", "beans" : "https://images-na.ssl-images-amazon.com/images/I/81jSxkIyr%2BL._SY550_.jpg",
"water": "https://ik.imagekit.io/ontimesupplies/oppictures/images/180489.JPG?tr=w-1500", "fish": "https://jpg.westernkosher.com/content/images/thumbs/0055127_fresh-fish_300.jpeg", "bread": "https://bakingamoment.com/wp-content/uploads/2020/01/IMG_7173-white-bread-2.jpg"
}

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

var markers = [];

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
      </GoogleMap>
    );
    }
}

class RestaurantInterface extends React.Component {
  constructor(props){
    super(props);
    this.state ={
      changed : false,
      crowdCount: -1,
      waitCount : -1
    };
  }

  handleCrowdedReport(status) { // 0 = not crowded, 1 = somewhat crowded, 2 = crowded
    //alert("crowdedness report with status " + status);

    const storesRef = firebase.database().ref('stores');
    storesRef.once('value', snap => {
      let stores = snap.val();
      let d = new Date();
      for(let store in stores){
        if(stores[store].lat === this.props.location.lat && stores[store].long === this.props.location.lng){

          let crowdReport = {
            status: status,
            time: d.toString()
          };
  
          var newPostKey = firebase.database().ref().push().key;
          firebase.database().ref().child('/stores/' + store + '/crowdedness/' + newPostKey).set(crowdReport);
          this.setState({
            changed: !this.state.changed
          });
          break;
        }
      }
    });


  }

  handleWaitTimeReport(time) {
    //alert("wait time report with time " + time);
    
    if(time < 0){
      alert("Please enter a valid number.");
      return;
    }
    const storesRef = firebase.database().ref('stores');
    storesRef.once('value', snap => {
      let stores = snap.val();
      let d = new Date();
      for(let store in stores){
        if(stores[store].lat === this.props.location.lat && stores[store].long === this.props.location.lng){

          let waitReport = {
            waitTime: time,
            time: d.toString()
          };
          var newPostKey = firebase.database().ref().push().key;
          firebase.database().ref().child('/stores/' + store + '/waittime/' + newPostKey).set(waitReport);
          this.setState({
            changed: !this.state.changed
          });
          break;
        }
      }
    });

  }

  getActivityReports() { //use this.props.location to fetch from database - return average value of reports using int system above ^^^ (from last [x] hours)
    const storesRef = firebase.database().ref('stores');
    storesRef.once('value', snap => {
      let crowdCount = 0;
      let counter = 0;
      let stores = snap.val();
      for(let store in stores){
        if(stores[store].lat === this.props.location.lat && stores[store].long === this.props.location.lng){
          let items = stores[store].crowdedness;
          for(let reports in items){
            let dt = new Date(items[reports].time);
            let dtn = new Date();
            let diff = (dtn.getTime() - dt.getTime())/3600000;
            //console.log("diff in time: " + diff);
            if(diff >= 3.0){
              const ref = firebase.database().ref('stores/' + store + '/crowdedness/' + reports);
              ref.remove();
            }
            crowdCount += items[reports].status;
            counter++;
          }
        }
      }
      //this code instead of checking if counter == 0 in the final if statement to allow the component to re-render if there are no items in the db
      let crowdAvg = crowdCount/counter;
      if(Number.isNaN(crowdAvg)){
        crowdAvg = 10000;
      } 
      if(crowdAvg != this.state.crowdCount){
        this.setState({
          crowdCount: crowdAvg
        });
      }
    });
  }

  getReportedWaitTime() { //return average wait time in minutes from last 3 hours
    const storesRef = firebase.database().ref('stores');
    storesRef.once('value', snap => {
      let waitCount = 0;
      let counter = 0;
      let stores = snap.val();
      for(let store in stores){
        if(stores[store].lat === this.props.location.lat && stores[store].long === this.props.location.lng){
          let items = stores[store].waittime;
          for(let reports in items){
            let dt = new Date(items[reports].time);
            let dtn = new Date();
            let diff = (dtn.getTime() - dt.getTime())/3600000;
            //console.log("diff in time: " + diff);
            if(diff >= 3.0){
              const ref = firebase.database().ref('stores/' + store + '/waittime/' + reports);
              ref.remove();
            }
            waitCount += items[reports].waitTime;
            counter++;
          }
        }
      }
      let waitAvg = Math.floor(waitCount/counter);
      if(Number.isNaN(waitAvg)){
        waitAvg = 10000;
      } 
      if(waitAvg != this.state.waitCount){
        this.setState({
          waitCount: waitAvg
        });
      }
      
    });
  }

  render() {
    this.getActivityReports();
    this.getReportedWaitTime();
    const reportedLevel = this.state.crowdCount;
    var cheeseWheel; //not my idea
    var textColor;

    if(reportedLevel < 0.66){
      cheeseWheel = "Low";
      textColor = "text-success";
    }
    else if(reportedLevel < 1.33){
      cheeseWheel = "Moderate";
      textColor = "text-warning";
    }
    else if (reportedLevel <= 2.0){
      cheeseWheel = "High";
      textColor = "text-danger";
    }
    else { //reportedLevel NaN
      cheeseWheel = "Unknown";
      textColor = "text-white";
    }

    let waitStatus = (this.state.waitCount === -1 || this.state.waitCount > 9999) ? "unknown" : this.state.waitCount + " mins"; 
    return (
      <div>
        <h2>Reported Activity Level: <span className={textColor}>{cheeseWheel}</span></h2>
        <p>Wait time (approx.): {waitStatus}</p> 
        <br/>
        <p>Report activity level:</p>
        <Button block variant="success" className = "mb-1" onClick={() => this.handleCrowdedReport(0)}>Not Crowded</Button>
        <Button block variant="warning" className = "mb-1" onClick={() => this.handleCrowdedReport(1)}>Somewhat Crowded</Button>
        <Button block variant="danger" className = "mb-1" onClick={() => this.handleCrowdedReport(2)}>Very Crowded</Button>
        <br/>
        <form name="waitTimeForm">
          <div className="form-group w-50">
            <label>Report on approximate wait time (minutes):</label>
            <input max="180" name="waitTime" type="number" class="form-control" id="waitTime"/>
          </div>
            <Button variant="info" onClick={() => this.handleWaitTimeReport(Math.min(180, document.forms["waitTimeForm"]["waitTime"].value))}>Submit</Button>
        </form>
      </div>
    );
  }
}

class ItemWidget extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      changed: false,
      in: 0,
      out: 0
    }

  }

  handleStockChange(status) { //use location prop (this.props.location)
    alert(status ? "in stock request for " + this.props.itemName : "out of stock request for " + this.props.itemName);
    const storesRef = firebase.database().ref('stores');
    storesRef.once('value', snap => {
      let stores = snap.val();
      let d = new Date();
      for(let store in stores){
        if(stores[store].lat === this.props.location.lat && stores[store].long === this.props.location.lng){
          console.log(d);

          let itemReport = {
            status: status ? "in_stock" : "out_of_stock",
            time: d.toString()
          };
  
          var newPostKey = firebase.database().ref().push().key;
          firebase.database().ref().child('/stores/' + store + '/items/' + this.props.itemName + '/' + newPostKey).set(itemReport);
          this.setState({
            changed: !this.state.changed
          });
          break;
        }
      }
    });
    
    //update database with new stock status instead of alerting
  }

  getReports() { //get # of reports with status {status} from past three hours
    //possibly also delete entries that are too old
    const storesRef = firebase.database().ref('stores');
    storesRef.once('value', snap => {
      let inCount = 0;
      let outCount = 0;
      let stores = snap.val();
      for(let store in stores){
        if(stores[store].lat === this.props.location.lat && stores[store].long === this.props.location.lng){
          let items = stores[store].items;
          for(let item in items){


            if(this.props.itemName === item){
              for(let reports in items[item]){
                let dt = new Date(items[item][reports].time);
                let dtn = new Date();
                let diff = (dtn.getTime() - dt.getTime())/3600000;
                //console.log("diff in time: " + diff);
                if(diff >= 3.0){
                  const ref = firebase.database().ref('stores/' + store + '/items/' + item + '/' + reports);
                  ref.remove();
                }

                if(items[item][reports].status === "in_stock"){
                  inCount++;
                } else {
                  outCount++;
                }
              }
            }
          }
        
        }
      }
      if(inCount != this.state.in || outCount != this.state.out){
        this.setState({
          in: inCount,
          out: outCount
        });
      }
      
      //return {in: 4, out: 5}; //e.g. entries from last [x] hours are in stock, like 4 in stock vs. 5 oos
    });
  }

  render() {
    this.getReports();
    const ratio = this.state.in/(this.state.in + this.state.out);
    const displayedRatio = (this.state.in + this.state.out) === 0 ?  <span className="text-white">N/A</span> :
      (<span className={ratio > 0.5 ? "text-success" : "text-danger"}> 
      {(ratio * 100).toFixed(1)}%
      </span>)
    return (
      <div className="container mb-4">
        <div className="row row-cols-3">
          <div className="col text-center">
            <img id="itemImage" src={this.props.src}/>
            <p className="text-center text-white">{this.props.itemName}</p>
          </div>
          <div className="col">
            <Button block variant="success" className = "mb-1" onClick={() => this.handleStockChange(true)}>In Stock</Button>
            <Button block variant="danger" onClick={() => this.handleStockChange(false)}>Out of Stock</Button>
          </div>
          <div className="col text-center">
            <span className="text-warning">In stock Reports: {this.state.in}</span>
            <br/>
            <span className="text-warning">Out of Stock Reports: {this.state.out}</span>
            <br/>
            {displayedRatio}
          </div>
        </div>
      </div>
    )
  }
}

class GroceryInterface extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      searchVal: '',
      images: []
    }
  }
  
  getItems() { //location of the place is in this.props.selected.geometry
    const pineapple_url = "https://images-na.ssl-images-amazon.com/images/I/71%2BqAJehpkL._SL1500_.jpg";
    const storesRef = firebase.database().ref('stores')
  
    storesRef.on('value', snap => {
      let stores = snap.val();
      let itemImagePairs = [];
      for(let store in stores){
        if(this.props.location.lat === stores[store].lat && this.props.location.lng === stores[store].long){
          //console.log("store is: " + stores[store].name);
          let items = stores[store].items;
          
          for(let item in items){
            let i = {
              name: item,
              src: itemIcons.hasOwnProperty(item) ? itemIcons[item] : "https://images-na.ssl-images-amazon.com/images/I/71%2BqAJehpkL._SL1500_.jpg"
            }
            itemImagePairs.push(i);
          }

          if(Object.keys(this.state.images).length != Object.keys(itemImagePairs).length){
            //console.log("not the same!");
            this.setState({
              images : itemImagePairs
            });
          } 
        }
      }
    });
  }

  handleChange(e) {
    //console.log(e.target.value);
    this.setState({searchVal: e.target.value});
  }

  render() {
    this.getItems();
    var widgets = this.state.images.map(desc => {
      return (desc.name.includes(this.state.searchVal) ?
      <ItemWidget 
        key={desc.name}
        location={this.props.location} 
        itemName={desc.name}
        src={desc.src}
      /> : null)
    })
    
    if(widgets.every(v => !v)) { //if all entries in widgets are null (i.e. no items match filter)
      widgets = "No items match your search. Try another one."
    }

    return (
      <div>
      <Combobox aria-labelledby="searchbox">
        <ComboboxInput id="filterInput" onChange={e => this.handleChange(e)} placeholder="Filter items..."/>
      </Combobox>
      <br/> <br/>
      {widgets}
      </div>
    );
  }
}
class Sidebar extends React.Component {
  constructor(props){
    super(props);
  }

  render() { 
    var content;
    switch(this.props.selected.typeShort) {
      case 'G':
        content =
          <GroceryInterface
            location = {this.props.selected.geometry.location}/>;
        break;
      case 'R':
        content = 
        <RestaurantInterface
          location = {this.props.selected.geometry.location}/>;
    }
    return (
      <Menu disableAutoFocus right isOpen={this.props.isOpen} onStateChange={this.props.osc} width={'45%'}> 
        <h1 id="POIHeader">{this.props.selected.name}</h1>
        <br/>
        {content}
      </Menu>
    );
  }
}

export default function App() {
   
    const {isLoaded, loadError} = useLoadScript({
      googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      libraries: libraries
    })

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

function LoadLocation(newName, latitude, longitude, storeType){
  
  //console.log("LAT: " + latitude);
  let isGrocery = false;
  const itemsRef = firebase.database().ref('stores') 
  itemsRef.once('value', snap => {

    let items = snap.val();

    
    let newState = [];
    for(let item in items) {
      if(items[item].lat === latitude && items[item].long === longitude){
        //console.log("already in db!");
        return;
      }
    }

    let itemData;
    //console.log("not in db yet");
    for (let items in storeType){
    if(storeType === 'G'){
      itemData = {
        eggs: -1,
        milk: -1,
        rice: -1,
        flour: -1,
        chicken: -1,
        pasta: -1,
        water: -1,
        beans: -1,
        bread: -1,
        fish: -1,
      }
      isGrocery = true;
      break;
    } 
    
  }

  let postData = {
    name: newName,
    lat: latitude,
    long: longitude,
  };

  var newPostKey = firebase.database().ref().child('posts').push().key;

  console.log("writing to db");
  firebase.database().ref().child('/stores/' + newPostKey).set(postData);
  if(isGrocery){
    firebase.database().ref().child('/stores/' + newPostKey + '/items').set(itemData);
  }
  console.log("exiting loadlocation function");
  //

  });
  

  
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
        pan({lat, lng});
      }).catch(error => {
        console.log(error)
      });
  };
 
  const handleKeyPress = (event) => {
    if(event.key === 'Enter'){
      handleSelect(value);
    }
  }

  return (
    <div className = "search1">
      <Combobox onSelect={handleSelect} aria-labelledby="searchbox" onKeyPress={handleKeyPress}>
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
