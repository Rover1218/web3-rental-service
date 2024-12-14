// Solidity: RentalContract.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RentalService {
    struct Item {
        uint id;
        string name;
        uint pricePerDay;
        address payable owner;
        bool isRented;
    }

    Item[] public items;
    mapping(uint => address) public renters;

    event ItemAdded(uint id, string name, uint pricePerDay, address owner);
    event ItemRented(uint id, address renter);
    event ItemReturned(uint id, address renter);
    event ItemDeleted(uint id, address owner);

    /**
     * @dev Adds a new item to the rental platform.
     * @param _name The name of the item.
     * @param _pricePerDay The rental price per day in wei.
     */
    function addItem(string memory _name, uint _pricePerDay) public {
        require(_pricePerDay > 0, "Price must be greater than zero");
        uint id = items.length;
        items.push(Item(id, _name, _pricePerDay, payable(msg.sender), false));
        emit ItemAdded(id, _name, _pricePerDay, msg.sender);
    }

    /**
     * @dev Rents an available item by transferring the rental fee to the owner.
     * @param _id The ID of the item to rent.
     */
    function rentItem(uint _id) public payable {
        require(_id < items.length, "Invalid item ID");
        Item storage item = items[_id];
        require(!item.isRented, "Item is already rented");
        require(msg.value >= item.pricePerDay, "Insufficient payment");

        item.owner.transfer(msg.value);
        item.isRented = true;
        renters[_id] = msg.sender;

        emit ItemRented(_id, msg.sender);
    }

    /**
     * @dev Returns a rented item, making it available again for others.
     * @param _id The ID of the item to return.
     */
    function returnItem(uint _id) public {
        require(_id < items.length, "Invalid item ID");
        require(renters[_id] == msg.sender, "You are not the renter");

        Item storage item = items[_id];
        item.isRented = false;
        renters[_id] = address(0);

        emit ItemReturned(_id, msg.sender);
    }

    /**
     * @dev Deletes an item from the rental platform.
     * @param _id The ID of the item to delete.
     */
    function deleteItem(uint _id) public {
        require(_id < items.length, "Invalid item ID");
        Item storage item = items[_id];
        require(item.owner == msg.sender, "You are not the owner");

        // Remove item from the array
        items[_id] = items[items.length - 1];
        items.pop();

        emit ItemDeleted(_id, msg.sender);
    }

    /**
     * @dev Retrieves all items available on the platform.
     * @return An array of all items.
     */
    function getItems() public view returns (Item[] memory) {
        return items;
    }

    /**
     * @dev Retrieves the details of a specific item by ID.
     * @param _id The ID of the item to retrieve.
     * @return The item details.
     */
    function getItem(uint _id) public view returns (Item memory) {
        require(_id < items.length, "Invalid item ID");
        return items[_id];
    }
}