pragma solidity >=0.7.0 <0.8.0;
pragma abicoder v2;
contract FlightInsurance {

    struct InsurancePolicy {
        address passengerAddress;
        string passengerName;
        string flightNumber;
        string flightDate;
        string departureCity;
        string destinationCity;
        string status;
    }

    mapping(address => InsurancePolicy) public policies;
    address[] public addressArray; 
    address public insuranceProvider;
    uint256 public premium = 0.001 ether;
    uint256 public indemnity = 0.02 ether;

    modifier onlyPassenger() {
        require(msg.sender != insuranceProvider, "Only passengers can call this function");
        _;
    }

    modifier onlyInsuranceProvider() {
        require(msg.sender == insuranceProvider, "Only insurance provider can call this function");
        _;
    }

    constructor() {
        insuranceProvider = msg.sender;
    }

    function viewAvailablePolicy() external view onlyPassenger returns (string memory) {
        return "Premium: 0.001 Ether, Indemnity: 0.02 Ether, Coverage: Extreme weather";
    }

    function purchasePolicy(
        string memory _passengerName,
        string memory _flightNumber,
        string memory _flightDate,
        string memory _departureCity,
        string memory _destinationCity
    ) external payable onlyPassenger {
        require(msg.value >= premium, "Insufficient premium");
        require(policies[msg.sender].passengerAddress == address(0), "Policy already purchased");

        policies[msg.sender] = InsurancePolicy({
            passengerAddress: msg.sender,
            passengerName: _passengerName,
            flightNumber: _flightNumber,
            flightDate: _flightDate,
            departureCity: _departureCity,
            destinationCity: _destinationCity,
            status: "purchased"
        });
        addressArray.push(msg.sender);

        payable(insuranceProvider).transfer(premium);
    }

    function viewPurchasedPolicy() external view onlyPassenger returns (InsurancePolicy memory) {
        return policies[msg.sender];
    }

    function viewAllPolicies() external view onlyInsuranceProvider returns (InsurancePolicy[] memory) {
        InsurancePolicy[] memory allPolicies = new InsurancePolicy[](addressArray.length);
        for (uint256 i = 0; i < addressArray.length; i++) {
            address policyAddress = addressArray[i];
            allPolicies[i] = policies[policyAddress];
        }
        return allPolicies;
    }
    function viewBalance() external view returns (uint256) {
        return address(msg.sender).balance;
    }

    function payIndemnity(address payable _passengerAddress) external payable onlyInsuranceProvider returns (bool) {
        // Check if the policy exists for the provided passenger address
        require(policies[_passengerAddress].passengerAddress != address(0), "Policy not found");
        require(msg.value >= indemnity, "Insufficient value");

        // Transfer indemnity amount from insurance provider to passenger
        bool success = _passengerAddress.send(indemnity);
        require(success, "Transfer failed");

        return true;
    }


    function verify(address _passengerAddress) external  onlyInsuranceProvider {
        // Assume the conditions are extreme if this is being called
        require(policies[_passengerAddress].passengerAddress != address(0), "Policy not found");
        policies[_passengerAddress].status = "claimed";
    }
}
