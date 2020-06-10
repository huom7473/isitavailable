import React from "react";
import firebase from "./firebase.js"
import { Combobox, ComboboxInput, ComboboxPopover, ComboboxList, ComboboxOption } from "@reach/combobox";


const icons = {"high": "grocerygreen.png", "medium": "groceryorange.png", "low": "groceryred.png", "unknown": "groceryblue.png"};
export class ItemSearch extends React.Component{
    constructor(){
      super();
      this.state = {
        itemList: [],
        searchVal: ''
      }
    }
    componentDidMount(){
    //console.log("markers is " + global.markers);
      const itemsRef = firebase.database().ref('items');
      itemsRef.on('value', snap => {
        let items = snap.val();
        let itemNames = [];
        for(let item in items) {
          itemNames.push({
            item: items[item].item,
          });
        }
        this.setState({
          itemList: itemNames
        });
      });
    }

    getItemName(name){
        var splitStr = name.replace(/_/g, " ").toLowerCase().split(' ');
        for (var i = 0; i < splitStr.length; i++) {
            splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
        }
        return splitStr.join(' '); 
    }
    getDBName(name){
        return name.replace(/\s/g, "_").toLowerCase();
    }
    render(){
      const handleInput = (e) => {
        this.setState({ searchVal: e.target.value });

      };
      const handleSelect = (item) => {
        const storesRef = firebase.database().ref('stores') 

        storesRef.once('value', snap => {
            let isValidItem = false;
            for(let validItem in this.state.itemList){
                if(this.state.itemList[validItem].item === this.getDBName(item)){
                    isValidItem = true;
                }
            }
            let stores = snap.val();

          
            for(let marker in global.markers){
                if(global.markers[marker].icon.url !== "restaurant.svg"){
                    if(isValidItem){
                        let inDb = false;
                        for(let store in stores){
                            if(global.markers[marker].position.lat() === stores[store].lat && global.markers[marker].position.lng() === stores[store].long){
                                inDb = true;
                                let itemz;
                                itemz = stores[store].items;
                                let itemFound = false;
                                for(let inventoryItem in itemz){
                                    if(this.getDBName(item) === inventoryItem){
                                        itemFound = true;
                                        let avg;
                                        let inCount = 0;
                                        let outCount = 0;
                                        for (let reports in stores[store].items[inventoryItem]){
                                            
                                            if (stores[store].items[inventoryItem][reports].status === "in_stock") {
                                                inCount++;
                                            }
                                            else if (stores[store].items[inventoryItem][reports].status === "out_of_stock") {
                                                outCount++;
                                            }
                                        }
                                        if(inCount === 0 && outCount === 0){
                                            avg = -1;
                                        } else {
                                            avg = inCount/(inCount+outCount);
                                        }
                                        if(avg > 0.8){
                                            global.markers[marker].icon.url = icons["high"];
                                            global.markers[marker].setIcon(global.markers[marker].getIcon());
                                        } else if (avg > 0.3){
                                            global.markers[marker].icon.url = icons["medium"];
                                            global.markers[marker].setIcon(global.markers[marker].getIcon());
                                        } else if (avg >= 0){
                                            global.markers[marker].icon.url = icons["low"];
                                            global.markers[marker].setIcon(global.markers[marker].getIcon());
                                        } else {
                                            global.markers[marker].icon.url = icons["unknown"];
                                            global.markers[marker].setIcon(global.markers[marker].getIcon());
                                        }
                                    }   
                                }
                                if(!itemFound){
                                    global.markers[marker].icon.url = "groceryblue.png"
                                    global.markers[marker].setIcon(global.markers[marker].getIcon());
                                }
                            }
                        } 
                
                        if(!inDb){
                            global.markers[marker].icon.url = "groceryblue.png"
                            global.markers[marker].setIcon(global.markers[marker].getIcon());
                        }
                    } else {
                        global.markers[marker].icon.url = "groceryblue.png"
                        global.markers[marker].setIcon(global.markers[marker].getIcon());
                    }
                    
                    
              
                }
                else {

                    global.markers[marker].setMap(null);
                }
            }
        });
      };
      const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
          handleSelect(this.state.searchVal);
        }
      };
      return (
        <div className = "search2">
          <Combobox onSelect={handleSelect} aria-labelledby="searchbox" onKeyPress={handleKeyPress}>
            <ComboboxInput onChange={handleInput} placeholder="Search for an item..."/>
            <ComboboxPopover>
              <ComboboxList>
                {this.state.itemList.map(({ id, item} ) => (
                    <ComboboxOption key={item} value={this.getItemName(item)}>
                    </ComboboxOption>
                  ))}
              </ComboboxList>
            </ComboboxPopover>
          </Combobox>
        </div>
      );
    }
  }