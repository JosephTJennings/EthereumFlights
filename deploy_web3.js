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

async function checkExtremeConditions(weatherRecords, destinationCity, flightDate) {
    try {
        // Find weather record for the destination city and date
        console.log()
        const record = weatherRecords.find(record => record.city === destinationCity && record.date === flightDate);

        // If no record found, return false (weather not available)
        if (!record) {
            return false;
        }

        // Check if weather is hail or floods
        if (record.weather === 'Hail' || record.weather === 'Flood') {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error checking extreme conditions:', error);
        return false;
    }
}


(async () => {
    try {
        console.log('Running deployWithWeb3 script...')
        const weatherRecords = await readWeatherData();
        
        const constructorArgs = []    // Put constructor args (if any) here for your contract

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
            gas: '5000000000000000000' // Adjust gas limit
        });

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

        const boughtPolicy = await contract.methods.viewPurchasedPolicy().call({from: passengerAddress});
        console.log("Purchased Policy: " +  boughtPolicy);

        const extremeWeather = await checkExtremeConditions(weatherRecords, boughtPolicy.destinationCity, boughtPolicy.flightDate);
        if(extremeWeather) {
            console.log("-------------------------------------------------------------EXTREME WEATHER FOUND-----------------------------------------------------------");
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
        }
    } catch (e) {
        console.log(e.message)
    }
  })()


