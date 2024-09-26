// Utility Functions for Local Storage


function getLocalStorage(key) {
    let data = localStorage.getItem(key);
    console.log('Stored Trip Data:', data);

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
     showMicIconIfApiKeyExists();
     hideLoadingSpinner();

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
        friends: friends.length > 0 ? friends : [],  // Ensure friends are initialize
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
     let currency = document.getElementById('currency').value; // Get currency from input
    let conversionRate = parseFloat(document.getElementById('conversionRate').value); // Conversion rate USD to INR



  if (!currency || !amount || !conversionRate) {
        alert("Please ensure all fields (Amount, Currency, Conversion Rate) are filled.");
        return;
    }


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
        currency: currency, // Use dynamic currency
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
            Amount: <strong>${bill.amount} ${bill.currency}</strong>, 
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


// Function to collect and store OpenAI API key in Local Storage
function storeApiKey() {
    const apiKey = prompt("Please enter your OpenAI API key:");
    if (apiKey) {
        localStorage.setItem('openai_api_key', apiKey);
        alert("API Key saved successfully!");
        showMicIconIfApiKeyExists();  // Call function to show the mic icon if API key exists
    } else {
        alert("API Key not provided!");
    }
}

// Function to check if the API key exists and show mic icon
function showMicIconIfApiKeyExists() {
    const apiKey = localStorage.getItem('openai_api_key');
    if (apiKey) {
        document.getElementById('micIcon').style.display = 'inline';  // Show mic icon
    }
}

// Call this function on page load to check if API key is already stored


let mediaRecorder;  // To handle audio recording
let audioChunks = [];  // To store recorded audio chunks
let isRecording = false;  // Track recording state
let mediaStream;  // To hold the media stream

// Function to start recording audio from the microphone
function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaStream = stream;  // Store the media stream to stop later
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];  // Clear any previous audio chunks

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);  // Collect audio data chunks
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });  // Create blob from audio chunks
                handleVoiceInput(audioBlob);  // Pass the audio blob to Whisper API
            };

            mediaRecorder.start();  // Start recording
            console.log('Recording started...');
            updateMicButtonState(true);  // Update button to indicate recording is active
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
        });
}

// Function to stop recording audio
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();  // Stop recording
        console.log('Recording stopped...');

        // Stop all tracks in the media stream to release the microphone
        mediaStream.getTracks().forEach(track => track.stop());
        console.log('Microphone access stopped.');

        updateMicButtonState(false);  // Update button to indicate recording is stopped
    }
}

// Function to toggle recording state when the button is clicked
function toggleRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

// Function to update the button's appearance and state
function updateMicButtonState(isRecordingState) {
    const micButton = document.getElementById('micIcon');
    if (isRecordingState) {
        micButton.textContent = "🔴 Stop Recording";  // Change button text
        micButton.style.backgroundColor = "red";  // Change button color to red
    } else {
        micButton.textContent = "🎤 Start Recording";  // Change button text
        micButton.style.backgroundColor = "";  // Reset button color to default
    }
    isRecording = isRecordingState;  // Update recording state
}

// Function to handle voice input and send the audio to Whisper API
function handleVoiceInput(audioBlob) {
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
        alert("No OpenAI API key found. Please provide the key.");
        return;
    }
     showLoadingSpinner();
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice_input.wav');  // The captured audio file blob
    formData.append('model', 'whisper-1'); 
    formData.append('language', 'en');   // The Whisper model

    fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`  // Adding Bearer token
        },
        body: formData  // Sending form data with audio file and model
    })
    .then(response => response.json())
    .then(data => {
        const transcription = data.text;
        console.log("Transcription:", transcription);
        processTranscriptionForBill(transcription);  // Process the transcription
        hideLoadingSpinner();
    })
    .catch(error => {
        hideLoadingSpinner();
        console.error("Error in Whisper API:", error);
    });
}

// Attach the toggleRecording function to the mic button
document.getElementById('micIcon').addEventListener('click', toggleRecording);


// Function to process transcription and extract bill details
function processTranscriptionForBill(transcription) {
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
        alert("No OpenAI API key found. Please provide the key.");
        return;
    }

    // Construct the chat prompt
    const prompt = `Extract the following details as a JSON object from the text: 
                    "Who paid, how much, currency, conversion rate, equal split or % split, 
                    if % split, who owes what percent." Text: "${transcription}"

                    If the split is equal or even always return as equal.
                    If split is %/percentage  your output for that field will be percentage

                       Example output 1 : 
                        WhoPaid : Thomas Jhon
                        Amount :  52  
                        Currency :  USD
                        ConversionRate : 83 
                        Splittype :  equal

                         Example output 2 : 
                        WhoPaid : Thomas Jhon
                        Amount :  52  
                        Currency :  USD
                        ConversionRate : 83 
                        Splittype :  percentage",
                        SplitDetails:{
                        Thomas Jhon: 20%,
                        Mathew : 20%,
                        Jerry : 30%,
                        Adam : 30%

                        Output will be only the JSON
                    }
  


                        `;

    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4',  // Specify the GPT model
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 200,
            temperature: 0.0
        })
    })
    .then(response => response.json())
    .then(data => {
        const billDetails = data.choices[0].message.content.trim();
        console.log("Extracted Bill Data:", billDetails);
        try {
            const billData = JSON.parse(billDetails);  // Parse the JSON response
            // Validate if all required fields are present
            if (validateBillData(billData)) {
                createBillFromVoiceInput(billData);  // Pass the data to a function to create a bill
            } else {
                alert("Incomplete bill details. Please try again.");
            }
        } catch (error) {
            console.error("Error parsing JSON:", error);
            alert("Failed to parse bill details. Please try again.");
        }
    })
    .catch(error => {
        console.error("Error in OpenAI API:", error);
    });
}


// Function to validate extracted bill data
// Function to validate extracted bill data
// Function to validate extracted bill data
function validateBillData(billData) {
    // Check if required fields are present
    if (!billData.WhoPaid || !billData.Amount || !billData.Currency || !billData.ConversionRate || !billData.SplitType) {
        return false;  // If any of these required fields are missing, return false
    }

    // Normalize the SplitType (handle "even" as a valid value for "equal")
    const normalizedSplitType = billData.SplitType.toLowerCase();

    // If the split type is "equal" or "even", no need to check for percentage details
    if (normalizedSplitType === 'equal' || normalizedSplitType === 'even') {
        return true;  // Everything required for an equal split is present
    }

    // If the split type is "percentage", check for SplitDetails
    if (normalizedSplitType === 'percentage') {
        if (!billData.SplitDetails || Object.keys(billData.SplitDetails).length === 0) {
            return false;  // If percentage split details are missing, return false
        }
        return true;  // All necessary percentage split details are present
    }

    return false;  // If the split type is neither "equal"/"even" nor "percentage", return false
}

function normalizeName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// Function to clear all input fields in the form
function clearAllFields() {
    // Clear text inputs, number inputs, and dropdowns
    document.getElementById('whoPaid').selectedIndex = 0;  // Reset the whoPaid dropdown
    document.getElementById('amount').value = '';  // Clear the amount field
    document.getElementById('currency').value = '';  // Clear the currency field
    document.getElementById('conversionRate').value = '';  // Clear the conversion rate field

    // Clear dynamically generated percentage split fields
    const owesFieldsDiv = document.getElementById('owesFields');
    owesFieldsDiv.innerHTML = '';  // Remove all dynamically generated percentage fields

    // Optional: Clear other fields if needed
    // You can add more fields to clear if necessary
}

// Attach the clearAllFields function to the clear button
document.getElementById('clearButton').addEventListener('click', clearAllFields);


// Function to create a bill from the voice input data and calculate the split
function createBillFromVoiceInput(billData) {
    // Normalize the name for "Who Paid" (capitalize first letter only)
    const normalizedWhoPaid = normalizeName(billData.WhoPaid);

    // Get the list of friends in the trip from local storage
    const tripData = getLocalStorage('tripData');
    const normalizedFriends = tripData.friends.map(friend => normalizeName(friend));  // Normalize all friend names

    // Check if the person who paid is in the friends list
    if (!normalizedFriends.includes(normalizedWhoPaid)) {
        alert(`The person who paid (${normalizedWhoPaid}) is not part of the trip. Please correct the bill.`);
        return;
    }

    // Populate the "Who Paid" dropdown
    const whoPaidDropdown = document.getElementById('whoPaid');
    let optionFound = false;

    // Iterate through the options in the dropdown and select the one matching `WhoPaid`
    for (let i = 0; i < whoPaidDropdown.options.length; i++) {
        let optionValue = normalizeName(whoPaidDropdown.options[i].value);  // Normalize the option value
        if (optionValue === normalizedWhoPaid) {
            whoPaidDropdown.selectedIndex = i;  // Set the selected option
            optionFound = true;
            break;
        }
    }

    // If no matching option was found, alert the user
    if (!optionFound) {
        alert(`The person who paid (${normalizedWhoPaid}) was not found in the dropdown. Please select manually.`);
    }

    // Calculate the total amount in INR
    const totalINR = billData.Amount * billData.ConversionRate;

    let splitDetails = {};  // Object to store split amounts

    // Check the SplitType and calculate the split accordingly
    if (billData.SplitType === 'percentage' && billData.SplitDetails) {
        // Check if all friends in SplitDetails exist in the trip's friends list
        let invalidFriends = [];
        Object.keys(billData.SplitDetails).forEach(friend => {
            const normalizedFriend = normalizeName(friend);

            // If the friend is not in the trip's friend list, mark them as invalid
            if (!normalizedFriends.includes(normalizedFriend)) {
                invalidFriends.push(normalizedFriend);
            }
        });

        // If any invalid friends are detected, reject the bill
        if (invalidFriends.length > 0) {
            alert(`The following friend(s) are not part of the trip: ${invalidFriends.join(', ')}. Please correct the bill.`);
            return;
        }

        // Calculate the percentage split for each valid friend
        Object.keys(billData.SplitDetails).forEach(friend => {
            const normalizedFriend = normalizeName(friend);
            const percentageValue = typeof billData.SplitDetails[friend] === 'string'
                ? parseInt(billData.SplitDetails[friend].replace('%', ''))  // If string, strip `%`
                : billData.SplitDetails[friend];  // If already numeric

            // Calculate the amount owed by each friend in INR
            const amountOwed = (totalINR * percentageValue) / 100;
            splitDetails[normalizedFriend] = amountOwed;
        });
    } else {
        // If no percentage split, perform equal split
        const splitPerPerson = totalINR / normalizedFriends.length;
        normalizedFriends.forEach(friend => {
            splitDetails[friend] = splitPerPerson;
        });
    }

    // Generate bill details for user confirmation
    let billDetails = `Bill Summary:\n`;
    billDetails += `Who Paid: ${normalizedWhoPaid}\n`;
    billDetails += `Amount: ${billData.Amount} ${billData.Currency} (₹${totalINR.toFixed(2)} in INR)\n`;
    billDetails += `Conversion Rate: 1 ${billData.Currency} = ₹${billData.ConversionRate}\n`;
    billDetails += `Split Details:\n`;

    Object.keys(splitDetails).forEach(friend => {
        billDetails += `${friend} owes: ₹${splitDetails[friend].toFixed(2)}\n`;
    });

    // Prompt the user to confirm the bill details
    if (confirm(billDetails + '\nDo you want to add this bill?')) {
        // If confirmed, add the bill to the trip data
        const newBill = {
            who_paid: normalizedWhoPaid,
            amount: billData.Amount,
            currency: billData.Currency,
            conversion_rate_to_inr: billData.ConversionRate,
            total_inr: totalINR,
            who_owes: splitDetails
        };

        tripData.bills.push(newBill);  // Add the bill to the stored trip data
        setLocalStorage('tripData', tripData);  // Save the updated trip data
        alert('Bill has been added successfully!');
        displayAllBills();
    } else {
        alert('Bill addition canceled.');
    }
}

// Function to check if the OpenAI API key is set and update the button accordingly
function updateApiKeyButton() {
    const apiKeyButton = document.getElementById('apiKeyButton');
    const storedApiKey = localStorage.getItem('openai_api_key');

    if (storedApiKey) {
        apiKeyButton.textContent = "Clear OpenAI Key";
    } else {
        apiKeyButton.textContent = "Set OpenAI Key";
    }
}

// Function to handle setting or clearing the OpenAI API key
function handleApiKeyButtonClick() {
    const storedApiKey = localStorage.getItem('openai_api_key');

    if (storedApiKey) {
        // If the key is already set, clear it
        if (confirm("Are you sure you want to clear the OpenAI API key?")) {
            localStorage.removeItem('openai_api_key');
            alert("OpenAI API key has been cleared.");
        }
    } else {
        // If no key is set, prompt the user to enter the key
        const newApiKey = prompt("Please enter your OpenAI API key:");
        if (newApiKey) {
            localStorage.setItem('openai_api_key', newApiKey);
            alert("OpenAI API key has been set.");
        }
    }

    // Update the button text based on the new state
    updateApiKeyButton();
}

// Attach the handleApiKeyButtonClick function to the button
document.getElementById('apiKeyButton').addEventListener('click', handleApiKeyButtonClick);

// Call the function to set the initial button text when the page loads
updateApiKeyButton();


// Function to show the loading spinner
function showLoadingSpinner() {
    console.log('Showing spinner');
    const spinner = document.getElementById('loadingSpinner');
    spinner.classList.remove('hidden'); // Try to remove the 'hidden' class
    spinner.style.display = 'flex'; // Force the display to 'flex'
}

// Function to hide the loading spinner
function hideLoadingSpinner() {
    console.log('Hiding spinner');
    const spinner = document.getElementById('loadingSpinner');
    spinner.classList.add('hidden'); // Try to add the 'hidden' class
    spinner.style.display = 'none'; // Force the display to 'none'
}
