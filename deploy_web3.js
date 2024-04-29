// const apiKey = '019e0b3dd0f94eec848234415242804'; // Replace 'YOUR_API_KEY' with your WeatherAPI.com API key
//     const apiUrl = `http://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${city}&dt=${date}`;

async function fetchWeatherData(city, date) { // NOTE: API LIMITS HISTORICAL DATA ONLY TO WITHIN LAST 365 DAYS
    const apiKey = '019e0b3dd0f94eec848234415242804'; // Replace 'YOUR_API_KEY' with your WeatherAPI.com API key
    const apiUrl = `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${city}&dt=${date}`;
    console.log(apiUrl);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error('Failed to fetch weather data');
    }
    
    const weatherData = await response.json();
    return weatherData;
}

async function checkExtremeConditionsLive(city, date) {
    try {
        const weatherData = await fetchWeatherData(city, date);
        
        // Extract weather condition from the response
        const weatherCondition = weatherData.forecast.forecastday[0].day.condition.text.toLowerCase();
        
        // Check if weather is extreme (you can define your own criteria here)
        if (weatherCondition.includes('hail') || weatherCondition.includes('flood') || weatherCondition.includes('heavy snow')) {
            return true; // Extreme weather found
        } else {
            return false; // No extreme weather
        }
    } catch (error) {
        console.error('Error checking extreme conditions:', error);
        return false;
    }
}

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
        

        const artifactsPath = `EthereumFlights/artifacts/FlightInsurance.json` // Change this for different path

        const metadata = JSON.parse(await remix.call('fileManager', 'getFile', artifactsPath))
        
        const accounts = await web3.eth.getAccounts()
        const passengerAddress = accounts[0];
        const insuranceProviderAddress = accounts[1];

        
        const contract = new web3.eth.Contract(metadata.abi);

        const constructorArgs = [];
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
            "2023-05-18", // Ensure correct format for the date
            "Hong Kong",
            "Miami"
        ).send({
            from: passengerAddress,
            value: '1000000000000000' // 0.001 ether in wei
        });

        const boughtPolicy = await contract.methods.viewPurchasedPolicy().call({from: passengerAddress});
        console.log("Purchased Policy: " +  boughtPolicy);

        alreadyClaimed = false;
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
            console.log("-------------------------------------------------------------------------------------------------------------------------------------------");
        }
        const extremeWeatherDateCheck = await checkExtremeConditionsLive(boughtPolicy.destinationCity, boughtPolicy.flightDate);
        console.log("Extreme weather real-data check: " + extremeWeatherDateCheck);
        if(extremeWeatherDateCheck && !alreadyClaimed) {
            console.log("-------------------------------------------------------------REAL EXTREME WEATHER FOUND-----------------------------------------------------------");
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
            console.log("-------------------------------------------------------------------------------------------------------------------------------------------");
        }
    } catch (e) {
        console.log(e.message)
    }
  })()


