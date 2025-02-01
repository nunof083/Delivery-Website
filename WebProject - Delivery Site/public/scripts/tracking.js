const statusTemplate = document.querySelector('.template-data');
const packageNumber = document.getElementById('package-number');
const packageStatus = document.getElementById('package-status');
const deliveryDate = document.getElementById('delivery-date');
const deliveryWeight = document.getElementById('delivery-weight');
const deliveryReceiver = document.getElementById('delivery-receiver');
const deliveryAddress = document.getElementById('delivery-address');
const statusContainer = document.getElementById('delivery-status');
const statusConverter = {
    'preparation': 'En préparation',
    'delivery': 'En livraison',
    'delivered': 'Livré',
    'problem': 'Problème'
}
const statusMessages = {
    'preparation': 'Votre colis est en cours de préparation',
    'delivery': 'Votre colis est en cours de livraison',
    'delivered': 'Votre colis a été livré',
    'problem': 'Votre colis a rencontré un problème'
}

function showPackageInfos({ packageData, clientData, statusData })
{
    packageNumber.textContent = `N° FD${packageData.trackingNumber}BE`;
    packageStatus.textContent = statusConverter[statusData.status][0].toUpperCase() + statusConverter[statusData.status].substring(1); //mettre premiere lettre en majuscule
    deliveryDate.textContent = statusData.date;
    deliveryWeight.textContent = packageData.weight;
    deliveryReceiver.textContent = clientData.name;
    deliveryAddress.textContent = clientData.address;
}
function ShowStatusesDetails(statusesDetailsData)
{
for (let i = statusesDetailsData.length-1; i>=0; i--) {
    const row = statusTemplate.content.cloneNode(true);
    const status = row.querySelector('.current-status');
    const dateHour = row.querySelector('.status-data');
    const message = row.querySelector('.status-description');
    console.log(statusesDetailsData[i].status);
    status.textContent = statusConverter[statusesDetailsData[i].status];
    dateHour.textContent = statusesDetailsData[i].date + ' ' + statusesDetailsData[i].hour;
    message.textContent = statusMessages[statusesDetailsData[i].status];
    if (i === 0)
    {
        row.querySelector('.greenball').remove(); //supprimer le cercle
    }
    else
    {
        row.querySelector('.blueball').remove();
    }

    statusContainer.appendChild(row);
}


}

async function completeData() {
    const urlId = window.location.search;
    const trackingNumberId = urlId.split('=')[1];
    console.log(trackingNumberId);

    try {
        const response = await fetch(`http://localhost:3000/packages/${trackingNumberId}`)
        const statusesResponse = await fetch(`http://localhost:3000/status/${trackingNumberId}`);
        const data = await response.json();
        const statusesDetailsData = await statusesResponse.json();
        const { packageData, clientData, statusData } = data;
        console.log(data);
        console.log(statusesDetailsData);
        const statuses = statusesDetailsData.statuses;


        showPackageInfos({ packageData, clientData, statusData });
        ShowStatusesDetails(statuses);
    } catch (e) {
        console.log('Error fetching data: ', e);
    }
}

document.addEventListener('DOMContentLoaded', completeData);