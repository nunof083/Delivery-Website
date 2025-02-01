const dateInput = document.getElementById('date');
const searchInput = document.getElementById('search');
const statusInput = document.getElementById('status');
const reinitialiseButton = document.getElementById('reinitialise-button');
const table = document.querySelector('table');
const templateRow = document.getElementById("template-row");
const role = localStorage.getItem('role');

//this object will convert the english status from the db
//to a french version
const statusConverter = {
    'all': 'Tous les status',
    'preparation': 'En préparation',
    'delivery': 'En livraison',
    'delivered': 'Livré',
    'problem': 'Problème'
};

//this function will set the data in the row
function setRow(row, packageData, clientData, statusData) {
    row.querySelector('.tracking-number').textContent = `FD${packageData.trackingNumber}BE`;
    row.querySelector('.date').textContent = statusData.date;
    row.querySelector('.client-name').textContent = clientData.name;
    row.querySelector('.address').textContent = clientData.address;
    row.querySelector('.package-status').textContent = statusConverter[statusData.status];
    row.querySelector('.driver-name').textContent = packageData.driverName;
    row.querySelector('.edit-package').textContent = '✏️️';
    row.querySelector('.delete-package').textContent = '🗑️️';
    row.classList.remove('hide');
    console.log(row);
}

//this function will color the status
//with its specific status color
function setStatusColor(row, statusData) {
    if (statusData.status === 'preparation') {
        row.classList.add('preparation');
    } else if (statusData.status === 'delivered') {
        row.classList.add('delivered');
    } else if (statusData.status === 'delivery') {
        row.classList.add('delivery');
    } else if (statusData.status === 'problem') {
        row.classList.add('problem');
    }
}

//this function will add the filters to the table
//searchbar + date + status
//they're all in one function because if I do them separately
//the function below will decide if the display is none, so it will only work for that one and not the others above
function applyFilters(row, packageData, statusData, clientData) {
    const statusValue = statusInput.value === 'all' || statusData.status === statusInput.value;
    const searchValue = searchInput.value === '' ||
        `FD${packageData.trackingNumber}BE`.toLowerCase().includes(searchInput.value.toLowerCase()) ||
        clientData.name.toLowerCase().includes(searchInput.value.toLowerCase()) ||
        clientData.address.toLowerCase().includes(searchInput.value.toLowerCase()) ||
        packageData.driverName.toLowerCase().includes(searchInput.value.toLowerCase());
    const dateValue = dateInput.value === '' || dateInput.value === statusData.date;

    if (statusValue && searchValue && dateValue) {
        row.style.display = '';
    } else {
        row.style.display = 'none';
    }
}

//this function will get the trackingNumber
//of the package we want to edit
//and will open the edit page for the specific trackingNumber
function editPackage(row) {
    const trackingNumber = row.querySelector('.tracking-number').textContent;
    row.querySelector('.edit-package').addEventListener('click', () => {
        window.location.href = `./edit-delivery.html?id=${trackingNumber}`;
    });
}

//this function will delete the package
//gets the trackingNumber of the data we want to delete
//and asks for a confirmation before deleting
function deletePackage(row) {
    const deleteButton = row.querySelector('.delete-package');
    deleteButton.addEventListener('click', async () => {
        const trackingNumber = row.querySelector('.tracking-number').textContent;
        if (confirm(`Voulez-vous vraiment supprimer la livraison ${trackingNumber} ?`)) {
            const response = await fetch(`http://localhost:3000/packages/${trackingNumber}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            console.log(data);
            await loadPackages();
        }
    });
}

//this function will make the reset button appear
//if the searchbar, date or status is not empty
function updateResetBtn() {
    if (searchInput.value !== '' || dateInput.value !== '' || statusInput.value !== 'all') {
        reinitialiseButton.classList.remove('hide');
    } else {
        reinitialiseButton.classList.add('hide');
    }
}

//this function will reset the inputs
function resetInputs() {
    searchInput.value = '';
    dateInput.value = '';
    statusInput.value = 'all';
}

//this function will create the rows by using the template
//and will set all the functionalities created above to each row
function createRows(packages) {
    packages.forEach(({packageData, clientData, statusData}) => {
        const row = templateRow.cloneNode(true).content.querySelector("tr");
        setRow(row, packageData, clientData, statusData)
        setStatusColor(row, statusData);
        editPackage(row);
        deletePackage(row);
        applyFilters(row, packageData, statusData, clientData);
        table.appendChild(row);
    });
}

//first we will see if the user is an admin
//if not we will redirect him to the login page
//if he is an admin we will load the packages
async function loadPackages() {
    if (role !== 'Admin') {
        window.location.href = './login.html';
    } else {
        const response = await fetch('http://localhost:3000/packages');
        const packages = await response.json();
        const rows = table.querySelectorAll('tr');
        //this will allow to go through all the rows (tr) of the table and remove them, except the first one (which is the header)
        rows.forEach((row, index) => {
            if (index !== 0) row.remove();
        });
        createRows(packages);
    }
}

addEventListener('load', async (event) => {
    event.preventDefault();
    await loadPackages();
})

statusInput.addEventListener('input', async () => {
    await loadPackages();
    updateResetBtn();
})

searchInput.addEventListener('input', async () => {
    await loadPackages();
    updateResetBtn();
});

dateInput.addEventListener('input', async () => {
    await loadPackages();
    updateResetBtn();
})

reinitialiseButton.addEventListener('click', async () => {
    resetInputs();
    updateResetBtn();
    await loadPackages();
});