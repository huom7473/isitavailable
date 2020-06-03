import React from "react";
import firebase from './firebase.js';
import Button from 'react-bootstrap/Button';
import Alert from "react-bootstrap/Alert";
export class ItemWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      changed: false,
      in: 0,
      out: 0,
      showAlert: false
    };
  }
  handleStockChange(status) {
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
    this.setState({showAlert: true});
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
                if (diff >= 3.0) {
                  const ref = firebase.database().ref('stores/' + store + '/items/' + item + '/' + reports);
                  ref.remove();
                }
                if (items[item][reports].status === "in_stock") {
                  inCount++;
                }
                else {
                  outCount++;
                }
              }
            }
          }
        }
      }
      if (inCount != this.state.in || outCount != this.state.out) {
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
    const ratio = this.state.in / (this.state.in + this.state.out);
    const displayedRatio = (this.state.in + this.state.out) === 0 ? <span className="text-white">N/A</span> :
      (<span className={ratio > 0.5 ? "text-success" : "text-danger"}>
        {(ratio * 100).toFixed(1)}%
      </span>);
    return (
    <div className="container mb-4">
      <Alert id="successMessage" show={this.state.showAlert} variant="success" onClose={() => {this.setState({showAlert: false})}} dismissible>Input Received!</Alert>
      <div className="row row-cols-3">
        <div className="col text-center">
          <img id="itemImage" src={this.props.src} />
          <p className="text-center text-white">{this.props.itemName}</p>
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
