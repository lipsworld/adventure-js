/*jslint white: true, browser: true, plusplus: true, nomen: true, vars: true */
/*global console, createjs, $, AdventureGame */


this.AdventureGame = this.AdventureGame || {};

/**
* Comtainer holds a collection of items
* It is not currently used and some troubleshooting will be required (this came from an earlier version that did use containers)
* The player's inventory is a container as is a toolbox or set of shelves
*/
(function() {
	"use strict";

	/**
	* Container object. Can hold many other objects
	* @class AdventureGame.Container
	*/
	var Container = function(options) {
		this.initialize(options);
	};
	var p = Container.prototype;
	
	/**
	* Unique identifier used to save and load this container
	* @nane id
	* @type string
	* @memberof AdventureGame.Container
	**/
	p.id = null;
	
	/**
	 * The unique name for this container
	 * @name name
	 * @type string
	 * @memberof AdventureGame.Container
	 **/
	p.name = null;
	
	/**
	 * The number of item slots in this container
	 * @name slots
	 * @type int
	 * @memberof AdventureGame.Container
	 **/
	p.slots = 10;
	
	/**
	 * The items currently held in this container
	 * @name items
	 * @type AdventureGame.Item[]
	 * @memberof AdventureGame.Container
	 **/
	p.items = null;
	
		
	/**
	* Setup function called by constructor
	* ## The following options are accepted:
	* * name string The container name (required)
	* * numSlows int The number of item slots in this container (Default: 10)
	* * items AdventureGame.Item[] The items currently held in this container
	* * open function Function to show when opening container if the default dialog is not desired
	* @function initialize
	* @memberof AdventureGame.Container
	* @param options Object containing configuraiton options
	* @return void
	*/
	p.initialize = function(options) {
		if(!options.id) {
			throw "No ID set for container";
		}
		this.id = options.id;
		if(!options.name) {
			throw "No name set for container";
		}
		this.name = options.name;
		if(options.numSlots) {
			this.slots = options.numSlots;
		}
		if(options.items) {
			this.items = options.items;
		} else {
			this.items = [];
		}
		// If there are more items than slots resize the container to fit them all
		if(this.items.length > this.slots) {
			this.slots = options.items.length;
		}
		if(options.open) {
			this.open = options.open;
		}
	};

	/**
	* Add an item to the container
	* @function addItem
	* @memberof AdventureGame.Container
	* @param item AdventureGame.Item The item to add to this container
	* @return void
	*/
	p.addItem = function(item) {
		var 
			returnVal = -1, 
			i,
			oldContainer = item.parentContainer;
		if(!item instanceof AdventureGame.Item) {
			console.log(item);
			throw "Invalid item";
		}
		if(this.items.length < this.slots) {
			// Find the next empty slot in the inventory
			for(i=0; i < this.items.length; i++) {
				if(this.items[i] === null) {
					break;	// This is the slot to stop at
				}
			}
			// Now remove from old container before adding to this one
			if(oldContainer) {
				oldContainer.removeItem(item);
				oldContainer.updateSave(false);
			}
			// Now add to this container
			item.slot = i;
			item.parentContainer = this;
			this.items[i] = item;
			this.updateSave(true);
			returnVal = i;
		} else {
			console.log("Container full");
		}
		return returnVal;
	};
	
	/**
	* Get all items in this container
	* @function getItems
	* @return Item[] Array of all items currently in this container
	**/
	p.getItems = function() {
		return this.items;
	};
	
	/**
	* Remove the given item from this array.
	* The item will only be removed if it correctly references its slot in the array.
	* @function removeItem
	* @memberof AdventureGame.Container
	* @param item AdventureGame.Item The item to remove from this container
	* @return void
	*/
	p.removeItem = function(item) {
		var 
			returnVal = -1,
			slot = item.slot;
		if(item.parentContainer === this && this.items[item.slot] === item) {
			this.items[item.slot] = null;
			item.parentContainer = null;
			item.slot = null;
			returnVal = slot;
			
			// Update save game
		}
		return returnVal;
	};
	
	/**
	* Update the contents of this container in the save game
	* @function updateSave
	* @param writeToDB boolean flag indicating if the save file should be written to the database after updating
	* @memberof AdventureGame.Container
	**/
	p.updateSave = function(writeToDB) {
		var 
			itemList = [],
			i;
		if(AdventureGame.saveGame) {
			// Go through each slot and if there is an item add it to the list of current items
			for(i=0; i<this.items.length; i++) {
				if(this.items[i]) {
					itemList.push(this.items[i].id);
				}
			}
			AdventureGame.saveGame.containers[this.id] = itemList;
			if(writeToDB) {
				AdventureGame.saveGameToDB();
			}
		}
	};
	
	
	/**
	* Show dialog for open container.
	* Load container from container array and create a div mirroring the items in there. 
	* @function open
	* @memberof AdventureGame.Container
	* @return void
	*/
	p.open = function() {
		var containerDiv, i, slotDiv, itemImg, dialog;
		console.log("Opening container "+this.name);
		containerDiv = document.createElement('div');
		containerDiv.id = 'container'+this.name;
		containerDiv.className = 'container';
		for(i=0; i<this.slots; i++) {
			slotDiv = document.createElement('div');
			slotDiv.id = "container_slot_"+i;
			slotDiv.className = 'slot';
			containerDiv.appendChild(slotDiv);
			if(this.items.length >= i+1 && this.items[i] !== null) {
				itemImg = document.createElement('img');
				itemImg.src = this.items[i].image.src;
				slotDiv.appendChild(itemImg);
				$(itemImg).on('click', {item:this.items[i]}, this.setClickHandler());
			}
		}

		dialog = new AdventureGame.Dialog({
			text: '<h3>'+this.name+'</h3>',
			domContent: containerDiv
		});
		dialog.show();
		
		AdventureGame.stage.on('click', function() {
		});	
	};
	
	/**
	* Check if an item exists with the given ID in this container
	* @function findItemWithId
	* @memberof AdventureGame.Container
	* @param id string The id of the item we are trying to match
	* @return index of the item in inventory or -1 if not found
	**/
	p.findItemWithId = function(id) {
		var 
			returnVal = -1,
			itemIndex;
		for(itemIndex = 0; itemIndex < this.items.length; itemIndex++) {
			if(this.items[itemIndex].id === id) {
				returnVal = itemIndex;
				break;
			}
		}
		return returnVal;
	};
	
	/**
	* Create click handler for an item
	* @function setClickHandler
	* @memberof AdventureGame.Container
	* @return function Click handler for this tiem
	*/
	p.setClickHandler = function() {
		return function(event) {
			event.data.item.activate();
		};
	};
	
	AdventureGame.Container = Container;
}());
	