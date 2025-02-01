const searchInput = document.getElementById('search');
const buttonSubmit = document.querySelector('.search-button');


//this function will load the tracking page
//if the tracking number is found in the db it will redirect to the tracking page
//of that package
async function loadTrackingPage() {
    const response = await fetch('http://localhost:3000/packages');
    const data = await response.json();
    const trackingNumber = searchInput.value;
    const packageData = data.find(({ packageData }) => `FD${packageData.trackingNumber}BE` === trackingNumber);
    console.log(packageData);
    if (packageData) {
        window.location.href = `../tracking.html?id=${trackingNumber}`;
    } else {
        alert('Colis non trouvé');
    }
}

buttonSubmit.addEventListener('click', async () => {
    await loadTrackingPage();
});

