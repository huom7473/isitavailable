import React from "react";
import firebase from './firebase.js';
import Button from 'react-bootstrap/Button';
import Alert from "react-bootstrap/Alert";
export class RestaurantInterface extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      changed: false,
      crowdCount: -1,
      waitCount: -1,
      showAlert: false
    };
  }
  handleCrowdedReport(status) {
    this.setState({showAlert: true});
    //alert("crowdedness report with status " + status);
    const storesRef = firebase.database().ref('stores');
    storesRef.once('value', snap => {
      let stores = snap.val();
      let d = new Date();
      for (let store in stores) {
        if (stores[store].lat === this.props.location.lat && stores[store].long === this.props.location.lng) {
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
    this.setState({showAlert: true});
    //alert("wait time report with time " + time);
    if (time < 0) {
      alert("Please enter a valid number.");
      return;
    }
    const storesRef = firebase.database().ref('stores');
    storesRef.once('value', snap => {
      let stores = snap.val();
      let d = new Date();
      for (let store in stores) {
        if (stores[store].lat === this.props.location.lat && stores[store].long === this.props.location.lng) {
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
  getActivityReports() {
    const storesRef = firebase.database().ref('stores');
    storesRef.once('value', snap => {
      let crowdCount = 0;
      let counter = 0;
      let stores = snap.val();
      for (let store in stores) {
        if (stores[store].lat === this.props.location.lat && stores[store].long === this.props.location.lng) {
          let items = stores[store].crowdedness;
          for (let reports in items) {
            let dt = new Date(items[reports].time);
            let dtn = new Date();
            let diff = (dtn.getTime() - dt.getTime()) / 3600000;
            //console.log("diff in time: " + diff);
            if (diff >= 3.0) {
              const ref = firebase.database().ref('stores/' + store + '/crowdedness/' + reports);
              ref.remove();
            }
            crowdCount += items[reports].status;
            counter++;
          }
        }
      }
      //this code instead of checking if counter == 0 in the final if statement to allow the component to re-render if there are no items in the db
      let crowdAvg = crowdCount / counter;
      if (Number.isNaN(crowdAvg)) {
        crowdAvg = 10000;
      }
      if (crowdAvg !== this.state.crowdCount) {
        this.setState({
          crowdCount: crowdAvg
        });
      }
    });
  }
  getReportedWaitTime() {
    const storesRef = firebase.database().ref('stores');
    storesRef.once('value', snap => {
      let waitCount = 0;
      let counter = 0;
      let stores = snap.val();
      for (let store in stores) {
        if (stores[store].lat === this.props.location.lat && stores[store].long === this.props.location.lng) {
          let items = stores[store].waittime;
          for (let reports in items) {
            let dt = new Date(items[reports].time);
            let dtn = new Date();
            let diff = (dtn.getTime() - dt.getTime()) / 3600000;
            //console.log("diff in time: " + diff);
            if (diff >= 3.0) {
              const ref = firebase.database().ref('stores/' + store + '/waittime/' + reports);
              ref.remove();
            }
            waitCount += items[reports].waitTime;
            counter++;
          }
        }
      }
      let waitAvg = Math.floor(waitCount / counter);
      if (Number.isNaN(waitAvg)) {
        waitAvg = 10000;
      }
      if (waitAvg !== this.state.waitCount) {
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
    if (reportedLevel < 0.66) {
      cheeseWheel = "Low";
      textColor = "text-success";
    }
    else if (reportedLevel < 1.33) {
      cheeseWheel = "Moderate";
      textColor = "text-warning";
    }
    else if (reportedLevel <= 2.0) {
      cheeseWheel = "High";
      textColor = "text-danger";
    }
    else { //reportedLevel NaN
      cheeseWheel = "Unknown";
      textColor = "text-white";
    }
    let waitStatus = (this.state.waitCount === -1 || this.state.waitCount > 9999) ? "unknown" : this.state.waitCount + " mins";
    return (<div>
      <Alert id="successMessage" show={this.state.showAlert} variant="success" onClose={() => {this.setState({showAlert: false})}} dismissible>Input Received!</Alert>
      <h2>Reported Activity Level: <span className={textColor}>{cheeseWheel}</span></h2>
      <p>Wait time (approx.): {waitStatus}</p>
      <br />
      <p>Report activity level:</p>
      <Button block variant="success" className="mb-1" onClick={() => this.handleCrowdedReport(0)}>Not Crowded</Button>
      <Button block variant="warning" className="mb-1" onClick={() => this.handleCrowdedReport(1)}>Somewhat Crowded</Button>
      <Button block variant="danger" className="mb-1" onClick={() => this.handleCrowdedReport(2)}>Very Crowded</Button>
      <br />
      <form name="waitTimeForm">
        <div className="form-group w-50">
          <label>Report on approximate wait time (minutes):</label>
          <input max="180" name="waitTime" type="number" className="form-control" id="waitTime" />
        </div>
        <Button variant="info" onClick={() => this.handleWaitTimeReport(Math.min(180, document.forms["waitTimeForm"]["waitTime"].value))}>Submit</Button>
      </form>
    </div>);
  }
}
