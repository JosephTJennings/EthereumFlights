pragma solidity >=0.7.0 <0.8.0;

contract FlightInsurance {

    struct InsurancePolicy {
        address passengerAddress;
        string passengerName;
        string flightNumber;
        uint256 flightDate;
        string departureCity;
        string destinationCity;
        string status;
    }

    mapping(address => InsurancePolicy) public policies;
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

    function viewAvailablePolicy() external pure returns (string memory) {
        return "Premium: 0.001 Ether, Indemnity: 0.02 Ether, Coverage: Extreme weather";
    }

    function purchasePolicy(
        string memory _passengerName,
        string memory _flightNumber,
        uint256 _flightDate,
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

        payable(insuranceProvider).transfer(premium);
    }

    function viewPurchasedPolicy() external view onlyPassenger returns (InsurancePolicy memory) {
        return policies[msg.sender];
    }

    function viewAllPolicies() external view onlyInsuranceProvider returns (InsurancePolicy[] memory) {
        InsurancePolicy[] memory allPolicies = new InsurancePolicy[](address(this).balance / premium);
        uint256 index = 0;
        for (uint256 i = 0; i < address(this).balance / premium; i++) {
            if (policies[insuranceProvider].passengerAddress != address(0)) {
                allPolicies[index] = policies[insuranceProvider];
                index++;
            }
        }
        return allPolicies;
    }
}
