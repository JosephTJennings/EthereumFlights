const axios = require('axios');

let weatherRecords = []; // Mock weather data for testing

// Function to fetch weather data from a public API
async function fetchWeatherData(city, date) {
    try {
        const response = await axios.get(`https://api.weather.gov/...?city=${city}&date=${date}`);
        return response.data; // Adjust this based on the actual response format
    } catch (error) {
        console.error("Error fetching weather data:", error);
        return null;
    }
}

// Function to verify flight delay based on weather conditions
async function verifyFlightDelay(contract, insuranceProviderAddress, passengerAddress, departureCity, flightDate) {
    // Fetch weather data for the departure city and flight date
    const weatherData = await fetchWeatherData(departureCity, flightDate);
    
    // If extreme weather conditions (e.g., hurricanes, rainstorms) are detected, trigger insurance verification and payout
    if (weatherData && (weatherData.weather === 'Hail' || weatherData.weather === 'Flood')) {
        // Call the verify function on the contract
        await contract.methods.verify(passengerAddress, departureCity, flightDate).send({
            from: insuranceProviderAddress
        });
        
        console.log("Flight delay verified and indemnity paid.");
    } else {
        console.log("No extreme weather detected for the given departure city and flight date.");
    }
}

(async () => {
    try {
        console.log('Running deployWithWeb3 script...')
        
        // const contractName = '1_Storage' // Change this for other contract
        const constructorArgs = []    // Put constructor args (if any) here for your contract
    
        // Note that the script needs the ABI which is generated from the compilation artifact.
        // Make sure contract is compiled and artifacts are generated
        const artifactsPath = `EthereumFlights/artifacts/FlightInsurance.json` // Change this for different path

        const metadata = JSON.parse(await remix.call('fileManager', 'getFile', artifactsPath))
        
        const accounts = await web3.eth.getAccounts()
        const passengerAddress = accounts[0];
        const insuranceProviderAddress = accounts[1];

        
        const contract = new web3.eth.Contract(metadata.abi);

        // Deploy the contract
        const deployedContract = await contract.deploy({
            data: metadata.data.bytecode.object,
            arguments: constructorArgs
        }).send({
            from: insuranceProviderAddress,
            gas: '5000000' // Adjust gas limit as needed
        });

        console.log("Contract deployed at address:", deployedContract.options.address);

        // Set the address of the deployed contract
        contract.options.address = deployedContract.options.address;

        console.log("STARTING");
        const curPolicy = await contract.methods.viewAvailablePolicy().call({from: passengerAddress});
        console.log(curPolicy);
        await contract.methods.purchasePolicy(
            "Alicia",
            "1",
            "2023-04-15", // Ensure correct format for the date
            "Hong Kong",
            "Denver"
        ).send({
            from: passengerAddress,
            value: '1000000000000000' // 0.001 ether in wei
        });

        console.log("Policy purchased successfully.");

        // View Purchased Policy
        const purchasedPolicy = await contract.methods.viewPurchasedPolicy().call({
            from: passengerAddress
        });

        console.log("Purchased Policy:", purchasedPolicy);

        await verifyFlightDelay(contract, insuranceProviderAddress, passengerAddress, 'Hong Kong', '2023-04-15');

        // Query the Ethereum blockchain for policy status and payment verification
        const policyStatus = await contract.methods.checkPolicyStatus(passengerAddress).call({
            from: passengerAddress
        });

        console.log("Policy Status:", policyStatus);
    } catch (e) {
        console.log(e.message)
    }
  })()


