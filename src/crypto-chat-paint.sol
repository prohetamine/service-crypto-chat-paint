// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/Strings.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract Authors {
    mapping(string => address) private authornames;
    mapping(address => string) private revAuthornames;
    
    function _setAuthorname(string memory name, address _address) internal {
        require(authornames[name] == address(0), "Author name is not free");
        authornames[name] = _address;
        if (bytes(revAuthornames[_address]).length > 0) {
            authornames[revAuthornames[_address]] = address(0);
        }
        revAuthornames[_address] = name;
    }

    function getAuthorByAddress(address _address) view public returns (string memory) {
        if (bytes(revAuthornames[_address]).length != 0) {
            return revAuthornames[_address];
        } else {
            return "";
        }
    }

    function getAddressByAuthor(string calldata name) view public returns (address) {
        if (authornames[name] != address(0)) {
            return authornames[name];
        } else {
            return address(0);
        }
    }
}

contract Chat {
    uint8 index = 0;
    mapping(uint8 => string) private messages;
    mapping(uint8 => address) private addressAuthors;

    function _addMessage(string memory _message, address _address) internal {
        messages[index] = string.concat(_message, ',', Strings.toString(block.timestamp));
        addressAuthors[index] = _address;
        index++;
        if (index > 100) {
            index = 0;
        }
    }

    function getMessage(uint8 _index) public view returns (string memory) {
        return messages[_index];
    }

    function getMessageAuthorAddress(uint8 _index) public view returns (address) {
        return addressAuthors[_index];
    }
}

contract Canvas {
    uint256 c_index = 0;
    mapping(uint256 => string) private draws;
    mapping(uint256 => address) private addressAuthors;

    function _addDraw(string calldata draw, address _address) internal returns (uint256) {
        c_index++;
        draws[c_index] = string.concat(draw, '|', Strings.toString(block.timestamp));
        addressAuthors[c_index] = _address;
        return c_index;
    }

    function getDraw(uint256 _index) public view returns (string memory) {
        return draws[_index];
    }

    function getDrawAuthorAddress(uint256 _index) public view returns (address) {
        return addressAuthors[_index];
    }
}

contract Text {
    function uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(42);
        s[0] = '0';
        s[1] = 'x';
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i + 2] = char(hi);
            s[2*i + 3] = char(lo);            
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}

contract Main is Text, Authors, Chat, Canvas {
    address internal owner;
    address internal token;

    constructor(address _token) {
        owner = msg.sender;
        token = _token;
    }

    function addMessage(string calldata _message) public {
        require(bytes(_message).length <= 2500, "Large message");

        address sender = msg.sender;
        require(bytes(_message).length != 0, "Message is empty");
        require(bytes(getAuthorByAddress(sender)).length != 0, "Author is not name");

        require(
            IERC20(token).transferFrom(sender, owner, 3),
            "Payment failed"
        );
        _addMessage(_message, sender);
    }

    function addDraw(string calldata draw) public {
        require(bytes(draw).length <= 2500, "Large draw data");
        
        address sender = msg.sender;
        require(bytes(draw).length != 0, "Draw is empty");
        require(bytes(getAuthorByAddress(sender)).length != 0, "Author is not name");
        require(
            IERC20(token).transferFrom(sender, owner, 5),
            "Payment failed"
        );
        uint256 index = _addDraw(draw, sender);
        string memory message = string.concat(
            "Draw in canvas ",
            toAsciiString(sender), 
            " ", 
            uintToString(index)
        );
        _addMessage(message, sender);   
    }

    function setAuthorname(string calldata name) public {
        require(bytes(name).length <= 40, "Large name");
        address sender = msg.sender;
        require(
            IERC20(token).transferFrom(sender, owner, 10),
            "Payment failed"
        );
        _setAuthorname(name, sender);
    }

    function getMyAddress() public view returns (address) {
        return msg.sender;
    }
}