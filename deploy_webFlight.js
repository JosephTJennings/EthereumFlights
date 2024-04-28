// const axios = require('axios');

const readWeatherData = async (filePath) => {
    try {
        let data = await remix.call('fileManager', 'getFile', 'browser/EthereumFlights/weather.txt')
        // Split the data into lines and parse each line to extract weather information
        const lines = data.split('\n').slice(1); // Skip the header line
        console.log(lines);
        const weatherRecords = lines.map(line => {
            const [date, city, weather] = line.trim().split(/\s+/);
            return { date, city, weather };
        });
        return weatherRecords;
    } catch (err) {``
        console.error('Error reading weather data:', err);
        throw err;
    }
};

(async () => {
    try {
        console.log('Running deployWithWeb3 script...')
        const weatherRecords = await readWeatherData();
        console.log(weatherRecords);
        
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
            gas: '5000000000000000000' // Adjust gas limit as needed
        });

        // Set the address of the deployed contract
        contract.options.address = deployedContract.options.address;

        console.log("STARTING");
        const curPolicy = await contract.methods.viewAvailablePolicy().call({from: passengerAddress});
        console.log(curPolicy);

        const prevBa = await contract.methods.viewBalance().call({from: passengerAddress});
        console.log("Prev balance: " + prevBa);

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

        console.log("Purchased Policy: " +  await contract.methods.viewPurchasedPolicy().call({from: passengerAddress}));

        const prevBal = await contract.methods.viewBalance().call({from: passengerAddress});
        console.log("Prev balance: " + prevBal);
        await contract.methods.verify(passengerAddress).send({from: insuranceProviderAddress});

        await contract.methods.payIndemnity(passengerAddress).send({
            from: insuranceProviderAddress,
            value: '300000000000000000'
        });
        const postBal = await contract.methods.viewBalance().call({from: passengerAddress});

        console.log("Post balance: " + postBal);
        console.log("Difference: " + (postBal - prevBal));
        console.log("All Policies:"  + await contract.methods.viewAllPolicies().call({from: insuranceProviderAddress}));
    } catch (e) {
        console.log(e.message)
    }
  })()


