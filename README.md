# Web3 Rental Service

This project demonstrates a basic Web3 rental service using Hardhat. It includes a sample contract, tests for that contract, and deployment scripts.

## Getting Started

To get started with this project, clone the repository and install the dependencies:

```shell
git clone https://github.com/yourusername/web3-rental-service.git
cd web3-rental-service
npm install
```

## Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Hardhat

## Running Tasks

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

## Project Structure

- `contracts/`: Contains the Solidity smart contracts.
- `scripts/`: Contains the deployment scripts.
- `test/`: Contains the test scripts.

## Contract Details

### RentalService Contract

The `RentalService` contract allows users to add, rent, return, and delete items on the rental platform.

#### Structs

- `Item`: Represents an item available for rent.
  - `uint id`: The ID of the item.
  - `string name`: The name of the item.
  - `uint pricePerDay`: The rental price per day in wei.
  - `address payable owner`: The owner of the item.
  - `bool isRented`: Indicates if the item is currently rented.

#### Functions

- `addItem(string memory _name, uint _pricePerDay)`: Adds a new item to the rental platform.
- `rentItem(uint _id)`: Rents an available item by transferring the rental fee to the owner.
- `returnItem(uint _id)`: Returns a rented item, making it available again for others.
- `deleteItem(uint _id)`: Deletes an item from the rental platform.
- `getItems() public view returns (Item[] memory)`: Retrieves all items available on the platform.
- `getItem(uint _id) public view returns (Item memory)`: Retrieves the details of a specific item by ID.

#### Events

- `ItemAdded(uint id, string name, uint pricePerDay, address owner)`: Emitted when a new item is added.
- `ItemRented(uint id, address renter)`: Emitted when an item is rented.
- `ItemReturned(uint id, address renter)`: Emitted when an item is returned.
- `ItemDeleted(uint id, address owner)`: Emitted when an item is deleted.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request.

## License

This project is licensed under the MIT License.
