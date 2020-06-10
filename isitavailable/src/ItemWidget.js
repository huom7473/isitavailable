import React from "react";
import firebase from './firebase.js';
import Button from 'react-bootstrap/Button';
import Alert from "react-bootstrap/Alert";
import Cookies from 'universal-cookie'
export class ItemWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      changed: false,
      in: 0,
      out: 0,
      showAlert: false,
      showDuplicateError: false,
      showTooManyError: false
    };
  }
  static showAlert = false;
  handleStockChange(status) {
    const cookies = new Cookies();
    var reportsCookie = cookies.get('totalReportsMade');
    const itemCookieName = this.props.location.lat + " " + this.props.location.lng + " " + this.props.itemName;
    const itemCookie = cookies.get(itemCookieName);
    const d = new Date();
    d.setTime(d.getTime() + (3*60*60000)); // cookies set expire after 3 hours
    if (reportsCookie) {
      if (reportsCookie.value >= 10) { // limit of 10 reports every 3 hours 
        this.setState({showTooManyError: true, showAlert: false, showDuplicateError: false}); //hide other alerts
        setTimeout(() => this.setState({showTooManyError: false}), 5000);
        return;
      }
    } else {
      cookies.set('totalReportsMade', {value: 0, expires: d});
    }
    if (itemCookie) {
      this.setState({showDuplicateError: true, showTooManyError: false, showAlert: false});
      setTimeout(() => this.setState({showDuplicateError: false}), 5000);
      return;
    } else {
      cookies.set(itemCookieName, true, {expires: d});
    }
    reportsCookie = cookies.get('totalReportsMade'); //have to refetch in case we just set it
    cookies.set('totalReportsMade', {value: reportsCookie.value + 1, expires: reportsCookie.expires}, {expires: new Date(reportsCookie.expires)});
    //alert(status ? "in stock request for " + this.props.itemName : "out of stock request for " + this.props.itemName);
    const storesRef = firebase.database().ref('stores');
    storesRef.once('value', snap => {
      let stores = snap.val();
      let d = new Date();
      for (let store in stores) {
        if (stores[store].lat === this.props.location.lat && stores[store].long === this.props.location.lng) {
          //console.log(d);
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
    if(!ItemWidget.showAlert){ //so that only one alert can show at a time
      this.setState({showAlert: true, showDuplicateError: false, showTooManyError: false});
      ItemWidget.showAlert = true;
      setTimeout(() => {
        this.setState({showAlert: false});
        ItemWidget.showAlert = false;
    }, 5000) //alert should only show for 5 sec
    }
    //update database with new stock status instead of alerting
  }
  getReports() {
    //possibly also delete entries that are too old
    const storesRef = firebase.database().ref('stores');
    storesRef.once('value', snap => {
      let inCount = 0;
      let outCount = 0;
      let stores = snap.val();
      for (let store in stores) {
        if (stores[store].lat === this.props.location.lat && stores[store].long === this.props.location.lng) {
          let items = stores[store].items;
          for (let item in items) {
            if (this.props.itemName === item) {
              for (let reports in items[item]) {
                let dt = new Date(items[item][reports].time);
                let dtn = new Date();
                let diff = (dtn.getTime() - dt.getTime()) / 3600000;
                //console.log("diff in time: " + diff);
                if (diff >= 3) {
                  //console.log("removing this ref!");
                  const ref = firebase.database().ref('stores/' + store + '/items/' + item + '/' + reports);
                  ref.remove();
                  //console.log("ref removed, the length is now " + Object.keys(items[item]).length);
                  if(Object.keys(items[item]).length === 0){
                    //console.log("should be empty : " + Object.keys(items[item]).length);
                    var obj = {};
                    obj[item] = -2;
                    var hopperRef = firebase.database().ref('stores/' + store + '/items');
                    hopperRef.update(obj);
                  }
                }
                if (items[item][reports].status === "in_stock") {
                  inCount++;
                }
                else if (items[item][reports].status === "out_of_stock"){
                  outCount++;
                }
              }
            }
          }
        }
      }
      if (inCount !== this.state.in || outCount !== this.state.out) {
        this.setState({
          in: inCount,
          out: outCount
        });
      }
      //return {in: 4, out: 5}; //e.g. entries from last [x] hours are in stock, like 4 in stock vs. 5 oos
    });
  }
  getItemName(name){
    var splitStr = name.replace(/_/g, " ").toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
       // You do not need to check if i is larger than splitStr length, as your for does that for you
       // Assign it back to the array
       splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
    }
   // Directly return the joined string
   return splitStr.join(' '); 

  }

  render() {
    this.getReports();
    const ratio = this.state.in / (this.state.in + this.state.out);
    const displayedRatio = (this.state.in + this.state.out) === 0 ? <span className="text-white">N/A</span> :
      (<span className={ratio > 0.5 ? "text-success" : "text-danger"}>
        {(ratio * 100).toFixed(1)}%
      </span>);
    return (
    <div className="container mb-4">
      <Alert id="groceryAlert"
             show={this.state.showAlert} 
             variant="success" 
             onClose={() => {ItemWidget.showAlert = false; this.setState({showAlert: false})}} 
             dismissible>
        Input Received!
      </Alert>
      <Alert id="groceryAlert"
             show={this.state.showTooManyError} 
             variant="danger" 
             onClose={() => {this.setState({showTooManyError: false})}} 
             dismissible>
        Too many reports. Please try again later.
      </Alert>
      <Alert id="groceryAlert"
             show={this.state.showDuplicateError}
             variant="danger" 
             onClose={() => {this.setState({showDuplicateError: false})}} 
             dismissible>
        Status already reported. Please try again later.
      </Alert>
      <div className="row row-cols-3">
        <div className="col text-center">
          <img id="itemImage" src={this.props.src} />
          <p className="text-center text-white"> {this.getItemName(this.props.itemName)}</p>
        </div>
        <div className="col">
          <Button block variant="success" className="mb-1" onClick={() => this.handleStockChange(true)}>In Stock</Button>
          <Button block variant="danger" onClick={() => this.handleStockChange(false)}>Out of Stock</Button>
        </div>
        <div className="col text-center">
          <span className="text-warning">In stock Reports: {this.state.in}</span>
          <br />
          <span className="text-warning">Out of Stock Reports: {this.state.out}</span>
          <br />
          {displayedRatio}
        </div>
      </div>
    </div>);
  }
}
