import React from "react";
import { slide as Menu } from 'react-burger-menu';
import { RestaurantInterface } from "./RestaurantInterface";
import { GroceryInterface } from "./GroceryInterface";
export class Sidebar extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    var content;
    switch (this.props.selected.typeShort) {
      case 'G':
        content =
          <GroceryInterface location={this.props.selected.geometry.location} />;
        break;
      case 'R':
        content =
          <RestaurantInterface location={this.props.selected.geometry.location} />;
    }
    return (<Menu disableAutoFocus right isOpen={this.props.isOpen} onStateChange={this.props.osc} width={'45%'}>
      <h1 id="POIHeader">{this.props.selected.name}</h1>
      <br />
      {content}
    </Menu>);
  }
}
