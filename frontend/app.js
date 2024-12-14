let contract;
let provider;
let signer;

// Add connection state
let isConnected = false;

const connectWalletButton = document.getElementById('connectWallet');
const listItemForm = document.getElementById('listItemForm');
const itemsList = document.getElementById('itemsList');

const contractABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_pricePerDay",
                "type": "uint256"
            }
        ],
        "name": "addItem",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getItems",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "pricePerDay",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address payable",
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "internalType": "bool",
                        "name": "isRented",
                        "type": "bool"
                    }
                ],
                "internalType": "struct RentalService.Item[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_id",
                "type": "uint256"
            }
        ],
        "name": "rentItem",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_id",
                "type": "uint256"
            }
        ],
        "name": "returnItem",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_id",
                "type": "uint256"
            }
        ],
        "name": "deleteItem",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Update network configuration for Sepolia
const EXPECTED_NETWORK = {
    chainId: '0xaa36a7', // Sepolia testnet
    name: 'Sepolia',
    networkParams: {
        chainId: '0xaa36a7',
        chainName: 'Sepolia test network',
        nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
        },
        rpcUrls: ['https://sepolia.infura.io/v3/'],
        blockExplorerUrls: ['https://sepolia.etherscan.io']
    }
};

// Add contract verification
async function verifyContract(address) {
    try {
        const code = await provider.getCode(address);
        return code !== '0x';
    } catch (error) {
        console.error('Error verifying contract:', error);
        return false;
    }
}

// Update network checking function
async function checkNetwork() {
    try {
        const network = await provider.getNetwork();
        if (network.chainId.toString() !== BigInt(EXPECTED_NETWORK.chainId).toString()) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: EXPECTED_NETWORK.chainId }],
                });
                return true;
            } catch (switchError) {
                // This error code means the chain has not been added to MetaMask
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [EXPECTED_NETWORK.networkParams],
                        });
                        return true;
                    } catch (addError) {
                        showNotification('Please add Sepolia network to your wallet manually', 'error');
                        return false;
                    }
                }
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error('Network check failed:', error);
        return false;
    }
}

async function connectWallet() {
    const button = document.getElementById('connectWallet');
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Connecting...';

    try {
        if (!window.ethereum) {
            throw new Error('Please install MetaMask!');
        }

        // Request account access using ethers v6 syntax
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();

        // Get the connected address
        const address = await signer.getAddress();

        // Update button appearance
        button.innerHTML = `
            <i class="fas fa-check-circle mr-2"></i>
            ${address.slice(0, 6)}...${address.slice(-4)}
        `;
        button.classList.remove('from-purple-500', 'to-pink-500');
        button.classList.add('from-green-500', 'to-green-600');

        // Initialize contract
        await initializeContract();

        isConnected = true;
        showNotification('Wallet connected successfully!', 'success');

        // Load items after connecting wallet
        await loadItems();
    } catch (error) {
        isConnected = false;
        console.error('Error connecting wallet:', error);
        button.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>Failed to Connect';

        // Show error notification
        showNotification(error.message, 'error');

        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-wallet mr-2"></i>Connect Wallet';
        }, 2000);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
        } text-white z-50 animate-fadeIn`;

    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' :
            type === 'error' ? 'fa-exclamation-circle' :
                'fa-info-circle'
        } mr-2"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Update initializeContract function to fetch contract address dynamically
async function initializeContract() {
    try {
        const response = await fetch('contractAddress.json');
        const { address: contractAddress } = await response.json();

        console.log('Contract address:', contractAddress); // Log the contract address

        if (!signer) {
            throw new Error('Please connect wallet first');
        }

        // Verify network
        const correctNetwork = await checkNetwork();
        if (!correctNetwork) {
            throw new Error(`Please switch to ${EXPECTED_NETWORK.name}`);
        }

        // Verify contract
        const isValidContract = await verifyContract(contractAddress);
        if (!isValidContract) {
            throw new Error('Invalid contract address');
        }

        contract = new ethers.Contract(contractAddress, contractABI, signer);

        console.log('Contract instantiated:', contract); // Log contract instance

        // Test call to confirm contract is working
        try {
            const items = await contract.getItems();
            console.log('Contract connected, items:', items);
        } catch (error) {
            console.error('Error calling getItems:', error);
            logError(error); // Existing error logging

            // Detailed error information
            console.error('Contract call failed with:', {
                code: error.code,
                message: error.message,
                stack: error.stack,
                transaction: error.transaction,
            });

            throw new Error('Contract interaction failed. Please check contract deployment and ABI.');
        }

        showNotification('Contract connected successfully', 'success');
    } catch (error) {
        console.error('Error initializing contract:', error);
        contract = null;
        showNotification('Error initializing contract: ' + error.message, 'error');
    }
}

function showLoading(element) {
    element.innerHTML = `
        <div class="loading-spinner"></div>
        <span class="ml-2">Processing...</span>
    `;
    element.disabled = true;
}

function hideLoading(element, text) {
    element.innerHTML = text;
    element.disabled = false;
}

// Add window load event listener to load items automatically
window.addEventListener('load', async () => {
    if (window.ethereum) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                // Auto-connect if already authorized
                await connectWallet();
            }
        } catch (error) {
            console.error('Error auto-connecting:', error);
        }
    }
});

async function listItem(event) {
    event.preventDefault();

    if (!isConnected || !contract) {
        showNotification('Please connect your wallet first', 'error');
        return;
    }

    const submitButton = event.target.querySelector('button[type="submit"]');
    showLoading(submitButton);

    try {
        const name = document.getElementById('itemName').value;
        const priceInput = parseFloat(document.getElementById('price').value);

        // Enhanced input validation
        if (!name) {
            throw new Error('Please enter item name');
        }

        if (isNaN(priceInput) || priceInput <= 0) {
            throw new Error('Price must be greater than 0');
        }

        // Convert price to Wei
        const price = ethers.parseEther(priceInput.toString());

        // Send transaction
        const tx = await contract.addItem(
            name,
            price,
            {
                gasLimit: 300000
            }
        );

        showNotification('Transaction submitted. Waiting for confirmation...', 'info');

        await tx.wait();
        showNotification('Item listed successfully!', 'success');
        await loadItems();
        event.target.reset();
    } catch (error) {
        console.error('Error listing item:', error);
        logError(error);
        showNotification(error.message, 'error');
    } finally {
        hideLoading(submitButton, 'List Item');
    }
}

async function loadItems() {
    if (!contract) {
        itemsList.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-wallet text-4xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Please connect your wallet to view items</p>
            </div>
        `;
        return;
    }

    try {
        // Add loading state
        itemsList.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-gray-400">Loading items...</p>
            </div>
        `;

        const itemsResult = await contract.getItems();
        console.log('Raw items result:', itemsResult);

        // Convert Result object to regular array and extract values
        const items = [];
        for (let i = 0; i < itemsResult.length; i++) {
            const rawItem = itemsResult[i];
            // Access properties using array indices based on the struct order
            const item = {
                id: Number(rawItem.id),          // id
                name: String(rawItem.name),        // name
                pricePerDay: BigInt(rawItem.pricePerDay), // pricePerDay
                owner: String(rawItem.owner),       // owner
                isRented: Boolean(rawItem.isRented)    // isRented
            };
            items.push(item);
        }

        console.log('Processed items:', items);

        const userAddress = await signer.getAddress();

        if (!items || items.length === 0) {
            itemsList.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-box-open text-4xl text-gray-600 mb-4"></i>
                    <p class="text-gray-400">No items available at the moment</p>
                </div>
            `;
            return;
        }

        itemsList.innerHTML = items.map((item) => `
            <div class="item-card relative">
                <div class="grid grid-cols-[1fr,auto,auto] gap-2 items-start mb-4">
                    <h3 class="text-xl font-semibold gradient-text">${item.name}</h3>
                    <span class="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                        ${!item.isRented ? 'Available' : 'Rented'}
                    </span>
                    ${item.owner === userAddress ? `
                        <button onclick="deleteItem(${item.id})"
                                class="bg-red-500/10 text-red-400 p-2.5 rounded-lg hover:bg-red-500 
                                       hover:text-white transform hover:scale-110 active:scale-95
                                       transition-all duration-300 ease-in-out shadow-lg hover:shadow-red-500/25
                                       border border-red-500/20">
                            <i class="fas fa-trash-alt text-sm"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="owner text-sm text-gray-400 mb-4">
                    Owner: ${item.owner.slice(0, 6)}...${item.owner.slice(-4)}
                </div>
                <div class="flex justify-between items-center mt-4">
                    <div>
                        <p class="text-sm text-gray-400">Price per day</p>
                        <p class="text-lg font-semibold text-purple-300">
                            ${ethers.formatEther(item.pricePerDay)} ETH
                        </p>
                    </div>
                    ${!item.isRented ? `
                        <button onclick="rentItem(${item.id})"
                                class="bg-gradient-to-r from-purple-500 to-pink-500 
                                       px-4 py-2 rounded-lg transform hover:scale-105 
                                       transition-all duration-300">
                            Rent Now
                        </button>
                    ` : `
                        ${renters[item.id] === userAddress ? `
                            <button onclick="returnItem(${item.id})"
                                    class="bg-gradient-to-r from-red-500 to-red-600 
                                           px-4 py-2 rounded-lg transform hover:scale-105 
                                           transition-all duration-300">
                                Return Item
                            </button>
                        ` : `
                            <span class="text-gray-400">Currently Rented</span>
                        `}
                    `}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading items:', error);
        logError(error);
        itemsList.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
                <p class="text-gray-400">Error loading items: ${error.message}</p>
                <button onclick="loadItems()" class="mt-4 px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Update rentItem function to use the same item processing logic
async function rentItem(itemId) {
    if (!contract) {
        showNotification('Please connect your wallet first', 'error');
        return;
    }

    try {
        const itemsResult = await contract.getItems();
        const items = [];
        for (let i = 0; i < itemsResult.length; i++) {
            const rawItem = itemsResult[i];
            items.push({
                id: Number(rawItem.id),
                name: String(rawItem.name),
                pricePerDay: BigInt(rawItem.pricePerDay),
                owner: String(rawItem.owner),
                isRented: Boolean(rawItem.isRented)
            });
        }

        const item = items.find(i => i.id === itemId);

        if (!item || item.isRented) {
            throw new Error('Item is not available for rent');
        }

        const tx = await contract.rentItem(itemId, {
            value: item.pricePerDay,
            gasLimit: 300000
        });

        showNotification('Processing rental transaction...', 'info');
        await tx.wait();
        showNotification('Item rented successfully!', 'success');
        await loadItems();
    } catch (error) {
        console.error('Error renting item:', error);
        logError(error);
        showNotification(
            error.message.includes('insufficient funds') ?
                'Insufficient funds to rent this item' :
                'Error renting item: ' + error.message,
            'error'
        );
    }
}

// Add returnItem function
async function returnItem(itemId) {
    if (!contract) {
        showNotification('Please connect your wallet first', 'error');
        return;
    }

    try {
        const tx = await contract.returnItem(itemId, {
            gasLimit: 300000
        });

        showNotification('Processing return transaction...', 'info');
        await tx.wait();
        showNotification('Item returned successfully!', 'success');
        await loadItems();
    } catch (error) {
        console.error('Error returning item:', error);
        logError(error);
        showNotification('Error returning item: ' + error.message, 'error');
    }
}

// Add deleteItem function
async function deleteItem(itemId) {
    if (!contract) {
        showNotification('Please connect your wallet first', 'error');
        return;
    }

    try {
        const tx = await contract.deleteItem(itemId, {
            gasLimit: 300000
        });

        showNotification('Processing delete transaction...', 'info');
        await tx.wait();
        showNotification('Item deleted successfully!', 'success');
        await loadItems();
    } catch (error) {
        console.error('Error deleting item:', error);
        logError(error);
        showNotification('Error deleting item: ' + error.message, 'error');
    }
}

function toggleForm() {
    const form = document.getElementById('listingForm');
    form.classList.toggle('hidden');

    if (!form.classList.contains('hidden')) {
        form.scrollIntoView({ behavior: 'smooth' });
    }
}

function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}

// Define validatePriceInput function
function validatePriceInput(input) {
    if (input.value < 0) {
        input.value = 0;
    }
}

connectWalletButton.addEventListener('click', connectWallet);
listItemForm.addEventListener('submit', listItem);

// Add debug helper
function logError(error) {
    console.error('Error details:', {
        message: error.message,
        data: error.data,
        code: error.code,
        reason: error.reason,
        transaction: error.transaction,
    });
}
