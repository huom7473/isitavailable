import React from "react";
import firebase from "./firebase.js"
import { Combobox, ComboboxInput, ComboboxPopover, ComboboxList, ComboboxOption } from "@reach/combobox";

export class ItemSearch extends React.Component{
    constructor(){
      super();
      this.state = {
        itemList: []
      }
    }
    componentDidMount(){
    console.log("markers is " + global.markers);
      const itemsRef = firebase.database().ref('items');
      itemsRef.on('value', snap => {
        let items = snap.val();
        let itemNames = [];
        for(let item in items) {
          itemNames.push({
            item: items[item].item,
          });
        }
        console.log("im here now: " + itemNames);
        this.setState({
          itemList: itemNames
        });
      });
    }
    render(){
      const handleInput = (e) => {
      };
      const handleSelect = (item) => {
        const storesRef = firebase.database().ref('stores') 
        storesRef.once('value', snap => {
          let stores = snap.val();
            for(let marker in global.markers){
              if(global.markers[marker].icon.url === "grocery.png"){
                let inDb = false;
                for(let store in stores){
                    if(global.markers[marker].position.lat() === stores[store].lat && global.markers[marker].position.lng() === stores[store].long){
                        inDb = true;
                        console.log(global.markers[marker].icon.url);
                        let itemz;
                        itemz = stores[store].items;
                        for(let inventoryItem in itemz){
                            if(item === inventoryItem){
                                let avg;
                                console.log(stores[store].items[inventoryItem]);
                                for (let reports in stores[store].items[inventoryItem]){
                                    let inCount = 0;
                                    let outCount = 0;
                                    if (stores[store].items[inventoryItem][reports].status === "in_stock") {
                                        inCount++;
                                    }
                                    else {
                                        outCount++;
                                    }
                                    if(inCount === 0 && outCount === 0){
                                        avg = -1;
                                    } else {
                                        avg = inCount/(inCount+outCount);
                                    }
                                }
                                if(avg > 0.8){
                                    global.markers[marker].icon.url = "grocerygreen.png"
                                } else if (avg > 0.3){
                                    global.markers[marker].icon.url = "groceryorange.png"
                                } else if (avg >= 0){
                                    global.markers[marker].icon.url = "groceryred.png"
                                } else {
                                    global.markers[marker].icon.url = "groceryblue.png"
                                }
                            }   
                        }
                    }
                } 
                
                if(!inDb){
                    global.markers[marker].icon.url = "groceryblue.png"
                }
              } else {

                global.markers[marker].setMap(null);
              }
              
            }
        });
      };
      return (
        <div className = "search2">
          <Combobox onSelect={handleSelect} aria-labelledby="searchbox">
            <ComboboxInput onChange={handleInput} placeholder="Search for an item..."/>
            <ComboboxPopover>
              <ComboboxList>
                {this.state.itemList.map(({ id, item} ) => (
                    <ComboboxOption key={id} value={item}>
                    </ComboboxOption>
                  ))}
              </ComboboxList>
            </ComboboxPopover>
          </Combobox>
        </div>
      );
    }
  }