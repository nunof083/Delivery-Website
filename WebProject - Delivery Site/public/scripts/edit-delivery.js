const trackNumber = document.getElementById('tracking-number');
const statusInput = document.getElementById('status');
const dateInput = document.getElementById('date');
const weight = document.getElementById('weight');
const clientName = document.getElementById('name');
const email = document.getElementById('email');
const clientPhone = document.getElementById('clientPhone');
const address = document.getElementById('address');
const driverName = document.getElementById('driver');
const deliveryNote = document.getElementById('delivery-note');
const role = localStorage.getItem('role');

//this function will get all the data from the form
//and return it in an object to post it on the db
function setDataOnDB() {
    const packageData = {
        date: dateInput.value,
        weight: weight.value,
        deliveryNote: deliveryNote.value,
        driverName: driverName.value,
    };

    const clientData = {
        name: clientName.value,
        email: email.value,
        phone: clientPhone.value,
        address: address.value
    };

    const statusData = {
        status: statusInput.value,
        date: dateInput.value,
        hour: new Date().toLocaleTimeString()
    };

    return { packageData, clientData, statusData };
}

//save data on db
async function postData() {
    try {
        const response = await fetch('http://localhost:3000/packages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(setDataOnDB()),
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Erreur dans la sauvegarde du colis');
    }
}

//modify data of db
async function putData() {
    try {
        const response = fetch(`http://localhost:3000/packages/${trackNumber.value}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(setDataOnDB()),
        });
    } catch(error) {
        console.error('Error:', error);
        alert('Erreur dans la modification du colis');
    }
}

//this function will get the data from the db and set it in the form
//if we are in edit mode
function setDataInput(packageData, clientData, statusData) {
    trackNumber.value = `FD${packageData.trackingNumber}BE`;
    statusInput.value = statusData.status;
    dateInput.value = statusData.date;
    weight.value = packageData.weight;
    clientName.value = clientData.name;
    email.value = clientData.email;
    clientPhone.value = clientData.phone;
    address.value = clientData.address;
    deliveryNote.value = packageData.deliveryNote;

    const formattedDriverName = packageData.driverName.toLowerCase().replace(' ', '-');
    driverName.value = formattedDriverName;

    console.log(packageData);
    console.log(driverName.value);
}

async function autoComplete() {
    const urlId = window.location.search;
    const trackingNumber = urlId.split('=')[1];
    console.log(trackingNumber);

    try {
        const response = await fetch(`http://localhost:3000/packages/${trackingNumber}`);
        const data = await response.json();

        const { packageData, clientData, statusData } = data;
        setDataInput(packageData, clientData, statusData);
    } catch (e) {
        console.log('Error fetching data: ', e);
    }
}

//we will check if the user is an admin or not
//if not we will redirect him to the login page
//we will also get the last tracking number and add 1 to it
//if there is no tracking number we will set it to FD2384676
addEventListener('load', async () => {
    if (role !== 'Admin') {
        window.location.href = './login.html';
    } else {
        const response = await fetch('http://localhost:3000/packages');
        const data = await response.json();

        if (data.length === 0) {
            trackNumber.value = 'FD2384676BE';
        } else {
            trackNumber.value = `FD${data[data.length - 1].packageData.trackingNumber + 1}BE`;
        }
    }

    await autoComplete();
});

//here we will see if the url has an id
//if yes we will call the function putData() to modify the data
//else we will call the function postData to post the data
document.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault()

    const urlParams = new URLSearchParams(window.location.search);
    const isEdit = urlParams.has('id');

    if (isEdit) {
        await putData();
    } else {
        await postData();
    }
    window.location.href = './admin.html';
});

