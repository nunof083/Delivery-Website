const driverId = localStorage.getItem('id');
console.log(driverId);
const role = localStorage.getItem('role');
const templateNextDelivery = document.getElementById('driver-nxtdelivery');
const container = document.querySelector('.delivery-container');
const Icon = document.querySelector('.nodelivery');
const otherDeliveriesTemplate = document.getElementById('other-deliveries-template');
const otherDeliveriesContainer = document.querySelector('.other-deliveries');
let mainDeliveryNumber;
let mainDeliveryDate;

function showNextPackage(packages) {
    if (packages.status === 'delivered' || packages.status === 'problem') {
        Icon.classList.remove('hidden');
        alert('No packages found');
    } else {
        Icon.classList.add('hidden');
        const row = templateNextDelivery.content.cloneNode(true);
        const deliveryNumber = row.querySelector('.delivery-number');
        const nameClient = row.querySelector('.name-client');
        const phoneClient = row.querySelector('.phone-client');
        const addressClient = row.querySelector('.address-client');
        const instructionClient = row.querySelector('.instructions-client');
        const instructionsContainer = row.querySelector('.instructions-container');
        statusButton(row);
        deliveryNumber.textContent = `FD${packages.trackingNumber}BE`;
        mainDeliveryNumber = packages.trackingNumber;
        mainDeliveryDate = packages.date;
        nameClient.textContent = packages.clientName;
        phoneClient.textContent = packages.clientPhone;
        addressClient.textContent = packages.clientAddress;
        if (packages.deliveryNote === '') {
            instructionsContainer.classList.add('hidden');
        } else {
            instructionsContainer.classList.remove('hidden');
            instructionClient.textContent = packages.deliveryNote;
        }
        container.appendChild(row);
    }
}

function showOtherDeliveries(packages) {
    const packageNumber = packages.trackingNumber;
    const row = otherDeliveriesTemplate.content.cloneNode(true);
    const trackingNumber = row.querySelector('.tracking-number');
    const clientAddress = row.querySelector('.address-client');
    trackingNumber.textContent = `FD${packageNumber}BE`;
    clientAddress.textContent = packages.clientAddress;

    otherDeliveriesContainer.appendChild(row);
}

async function updateStatus(status) {
    if (mainDeliveryNumber === 0) {
        alert('No delivery found');
    } else {
        const statusData = {
            trackingNumber: mainDeliveryNumber,
            status: status,
            date: new Date().toISOString().split('T')[0],
            hour: new Date().toLocaleTimeString()
        };
        try {
            const response = await fetch(`http://localhost:3000/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(statusData),
            });
            if (!response.ok) {
                throw new Error('Failed to save status');
            }
            const messageData = await response.json();
            alert('Status saved successfully');
            window.location.reload();
        } catch (error) {
            console.error('Error:', error);
            alert('Error saving status');
        }
    }
}

async function getDriverDetails() {
    const response = await fetch(`http://localhost:3000/drivers/${driverId}/packages`);
    const data = await response.json();
    console.log(data);
    const packages = data.packages;

    if (packages.length === 0) {
        Icon.classList.remove('hidden');
        alert('No packages found');
    } else {
        const filteredPackages = packages.filter(pkg => pkg.status !== 'delivered' && pkg.status !== 'problem');
        if (filteredPackages.length > 0) {
            showNextPackage(filteredPackages[0]);
            console.log("More than one package found");
            for (let i = 1; i < filteredPackages.length; i++) {
                showOtherDeliveries(filteredPackages[i]);
            }
        } else {
            Icon.classList.remove('hidden');
            alert('No packages found');
        }
    }
}

function statusButton(row) {
    const markAsDeliveredBtn = row.querySelector('.deliveredbtn');
    markAsDeliveredBtn.addEventListener('click', async () => {
        await updateStatus('delivered');
    });
    const markAsProblemBtn = row.querySelector('.problembtn');
    markAsProblemBtn.addEventListener('click', async () => {
        await updateStatus('problem');
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const instructions = document.querySelector('.instructions-client');
    if (driverId === null) {
        alert('You must be logged in to access this page');
    } else if (role === 'Admin') {
        Icon.classList.remove('hidden');
    } else {
        await getDriverDetails();
    }
});