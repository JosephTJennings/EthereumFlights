// Right click on the script name and hit "Run" to execute
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
    } catch (e) {
        console.log(e.message)
    }
  })()


