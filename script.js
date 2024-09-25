// Utility Functions for Local Storage
function getLocalStorage(key) {
    let data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function setLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    console.log('Local Storage Set:', key, value);  // Debugging
}

// Initialization on Page Load
window.onload = function () {
    let tripData = getLocalStorage('tripData');
    if (tripData && tripData.tripName && tripData.friends.length > 0) {
        console.log('Trip Data Loaded:', tripData);
        document.getElementById('initialSetup').classList.add('hidden');
        document.getElementById('mainInterface').classList.remove('hidden');
        populateFriendsDropdown(tripData);
        displayAllBills();
        updateTally();
    } else {
        console.log('No Trip Data Found. Starting new trip.');
        document.getElementById('initialSetup').classList.remove('hidden');
        document.getElementById('mainInterface').classList.add('hidden');
    }
}

// Setup Form Submission
document.getElementById('setupForm').addEventListener('submit', function (e) {
    e.preventDefault();
    let tripName = document.getElementById('tripName').value.trim();
    if (tripName === "") {
        alert("Please enter a trip name.");
        return;
    }

    let tripData = {
        tripName: tripName,
        friends: friends,
        bills: []
    };

    console.log('Trip Data Created:', tripData);
    setLocalStorage('tripData', tripData);
    document.getElementById('initialSetup').classList.add('hidden');
    document.getElementById('mainInterface').classList.remove('hidden');
    populateFriendsDropdown(tripData);
    displayAllBills();
    updateTally();
});

// Friends Management
let friends = [];

function addFriend() {
    let friendName = document.getElementById('friendName').value.trim();
    if (friendName === "") {
        alert("Please enter a friend's name.");
        return;
    }
    if (friends.includes(friendName)) {
        alert("This friend is already added.");
        return;
    }
    friends.push(friendName);
    console.log('Friend Added:', friendName);
    document.getElementById('friendsList').innerHTML += `<li>${friendName}</li>`;
    document.getElementById('friendName').value = "";
}

// Populate Payer Dropdown
function populateFriendsDropdown(tripData) {
    try {
        let whoPaidSelect = document.getElementById('whoPaid');
        whoPaidSelect.innerHTML = ""; // Clear existing options
        tripData.friends.forEach(friend => {
            let option = document.createElement('option');
            option.value = friend;
            option.text = friend;
            whoPaidSelect.add(option);
        });
        console.log('Dropdown Populated with Friends:', tripData.friends);
    } catch (error) {
        console.error('Error populating dropdown:', error);
    }
}

// Split Evenly
function splitEvenly() {
    let tripData = getLocalStorage('tripData');
    if (!tripData) {
        alert('Trip data not found. Please start a new trip.');
        return;
    }

    let amount = parseFloat(document.getElementById('amount').value);
    let conversionRate = parseFloat(document.getElementById('conversionRate').value); // Conversion rate USD to INR

    let totalINR = amount * conversionRate;  // Convert total amount to INR

    let perPerson = (totalINR / tripData.friends.length).toFixed(2);  // Split in INR

    let owesFieldsDiv = document.getElementById('owesFields');
    owesFieldsDiv.innerHTML = "";
    tripData.friends.forEach(friend => {
        let field = document.createElement('div');
        field.style.marginBottom = '10px';
        field.innerHTML = `${friend} Owes: ₹${perPerson}`;
        owesFieldsDiv.appendChild(field);
    });
    document.getElementById('owesSection').classList.remove('hidden');
}

// Split by Percentage
function splitByPercentage() {
    let tripData = getLocalStorage('tripData');
    if (!tripData) {
        alert('Trip data not found. Please start a new trip.');
        return;
    }

    let amount = parseFloat(document.getElementById('amount').value);
    let conversionRate = parseFloat(document.getElementById('conversionRate').value); // Conversion rate USD to INR

    let totalINR = amount * conversionRate;  // Convert total amount to INR

    let owesFieldsDiv = document.getElementById('owesFields');
    owesFieldsDiv.innerHTML = "";
    tripData.friends.forEach(friend => {
        let field = document.createElement('div');
        field.style.marginBottom = '10px';
        field.innerHTML = `
            <label for="percent_${friend}">${friend} Owes (%):</label>
            <input type="number" id="percent_${friend}" step="1" min="0" max="100" value="0">
        `;
        owesFieldsDiv.appendChild(field);
    });
    document.getElementById('owesSection').classList.remove('hidden');
}

// Bill Form Submission
document.getElementById('billForm').addEventListener('submit', function (e) {
    e.preventDefault();
    let tripData = getLocalStorage('tripData');
    if (!tripData) {
        alert("Trip data not found. Please start a new trip.");
        return;
    }

    let whoPaid = document.getElementById('whoPaid').value;
    let amount = parseFloat(document.getElementById('amount').value); // Amount in USD
    let conversionRate = parseFloat(document.getElementById('conversionRate').value); // Conversion rate USD to INR

    let totalINR = amount * conversionRate;  // Convert total amount to INR
    console.log(`Total Amount in INR: ₹${totalINR}`);

    // Collect who owes how much in INR
    let whoOwes = {};
    let totalPercentage = 0;
    tripData.friends.forEach(friend => {
        let percentOwed = document.getElementById(`percent_${friend}`);
        if (percentOwed && percentOwed.value > 0) {
            let owedAmount = (totalINR * (percentOwed.value / 100)).toFixed(2);
            whoOwes[friend] = parseFloat(owedAmount);
            totalPercentage += parseFloat(percentOwed.value);
        }
    });

    // Check if percentage totals to 100% for custom splits
    if (totalPercentage > 0 && totalPercentage !== 100) {
        alert("Total percentages must equal 100.");
        return;
    }

    // If using even split, distribute the total INR amount equally
    if (Object.keys(whoOwes).length === 0) {
        let perPerson = (totalINR / tripData.friends.length).toFixed(2); // INR split per person
        tripData.friends.forEach(friend => {
            whoOwes[friend] = parseFloat(perPerson);
        });
    }

    // Create bill object
    let bill = {
        who_paid: whoPaid,
        amount: amount, // Original amount in USD
        currency: 'USD',
        conversion_rate_to_inr: conversionRate,
        total_inr: totalINR, // Store the converted INR amount
        who_owes: whoOwes
    };

    // Add bill to trip data
    tripData.bills.push(bill);
    console.log('Bill Added:', bill);
    setLocalStorage('tripData', tripData);

    // Reset form
    document.getElementById('billForm').reset();
    document.getElementById('owesSection').classList.add('hidden');

    // Update UI
    displayAllBills();
    updateTally();
});

// Display All Bills
function displayAllBills() {
    let tripData = getLocalStorage('tripData');
    if (!tripData) return;

    let allBillsDiv = document.getElementById('allBills');
    allBillsDiv.innerHTML = "";

    tripData.bills.forEach((bill, index) => {
        let owesText = "";
        for (let person in bill.who_owes) {
            owesText += `${person}: ₹${bill.who_owes[person].toFixed(2)}, `;
        }
        owesText = owesText.slice(0, -2); // Remove trailing comma and space

        let billItem = document.createElement('li');
        billItem.innerHTML = `
            <strong>Bill ${index + 1}:</strong> Paid by <strong>${bill.who_paid}</strong>, 
            Amount: <strong>${bill.amount} USD</strong>, 
            Conversion Rate: <strong>${bill.conversion_rate_to_inr}</strong>, 
            Total INR: <strong>₹${bill.total_inr}</strong>, 
            Who Owes: <em>${owesText}</em>
            <button onclick="deleteBill(${index})">Delete Bill</button>
        `;
        allBillsDiv.appendChild(billItem);
    });
}

// Delete a Bill
function deleteBill(index) {
    let password = prompt("Enter the password to delete this bill:");
    if (password !== "iagreetodelete") {
        alert("Incorrect password!");
        return;
    }

    let tripData = getLocalStorage('tripData');
    if (!tripData) return;

    tripData.bills.splice(index, 1);  // Remove the bill from the array
    setLocalStorage('tripData', tripData);  // Update the local storage
    displayAllBills();  // Refresh the bill list
    updateTally();  // Recalculate the tally
}

// Update Tally Table
function updateTally() {
    let tripData = getLocalStorage('tripData');
    if (!tripData) return;

    let settlement = {};

    // Initialize settlement
    tripData.friends.forEach(friend => {
        settlement[friend] = 0;
    });

    // Calculate settlement
    tripData.bills.forEach(bill => {
        let totalINR = bill.total_inr; // Total bill in INR

        // Subtract the total INR amount from the payer's balance
        settlement[bill.who_paid] -= totalINR;

        // Add the INR amount owed by each person
        for (let person in bill.who_owes) {
            settlement[person] += bill.who_owes[person];
        }
    });

    // Populate tally table
    let tallyTableBody = document.getElementById('tallyTable').getElementsByTagName('tbody')[0];
    tallyTableBody.innerHTML = "";

    for (let friend in settlement) {
        let row = tallyTableBody.insertRow();
        let cellName = row.insertCell(0);
        let cellAmount = row.insertCell(1);
        cellName.innerHTML = friend;
        cellAmount.innerHTML = settlement[friend].toFixed(2);
    }
}

// Clear Trip Data
function clearTripData() {
    let password = prompt("Enter the password to clear the trip data:");
    if (password !== "iagreetodelete") {
        alert("Incorrect password!");
        return;
    }

    localStorage.removeItem('tripData');
    alert("Trip data cleared!");
    window.location.reload();  // Reload the page to start over
}

// Export to Excel Functionality
function exportToExcel() {
    let tripData = getLocalStorage('tripData');
    if (!tripData) {
        alert("No trip data to export.");
        return;
    }

    // Prepare CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Bill No,Who Paid,Amount,Currency,Conversion Rate,Who Owes\n";

    tripData.bills.forEach((bill, index) => {
        let owes = "";
        for (let person in bill.who_owes) {
            owes += `${person}: ${bill.who_owes[person].toFixed(2)} INR; `;
        }
        owes = owes.slice(0, -2); // Remove trailing semicolon and space

        let row = [
            index + 1,
            bill.who_paid,
            bill.amount,
            bill.currency,
            bill.conversion_rate_to_inr,
            owes
        ].join(",");
        csvContent += row + "\n";
    });

    // Add Tally Section
    csvContent += "\nSettlement Tally\nFriend,Total Owes (INR)\n";

    let settlement = {};
    tripData.friends.forEach(friend => {
        settlement[friend] = 0;
    });

    tripData.bills.forEach(bill => {
        let inrTotal = bill.amount * bill.conversion_rate_to_inr;
        settlement[bill.who_paid] -= inrTotal;

        for (let person in bill.who_owes) {
            settlement[person] += bill.who_owes[person];
        }
    });

    for (let friend in settlement) {
        let row = `${friend},${settlement[friend].toFixed(2)}`;
        csvContent += row + "\n";
    }

    // Create a downloadable link
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${tripData.tripName}_Expenses.csv`);
    document.body.appendChild(link); // Required for FF

    link.click(); // This will download the data file named "trip_expenses.csv"
    document.body.removeChild(link);
}
