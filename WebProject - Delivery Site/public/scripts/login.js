

function CheckAuth(data) {

    if(data.role === 'Admin')
    {

        localStorage.setItem('authtoken', data.token)
        localStorage.setItem('role', data.role)
        localStorage.setItem('username', data.username)
        window.location.href = "../admin.html";

    }
     else if (data.role === 'Driver')
    {

        localStorage.setItem('authtoken', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', data.username);
        localStorage.setItem('id', data.id);
        window.location.href = "../driver-next-delivery.html";
    }
    else
    {
        alert("Mauvais email ou mot de passe");
    }

}

async function login() {
    console.log('Cliqué');
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;



    try {


        const response = await fetch('http://localhost:3000/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({email, password})
        });
        if(!response.ok){
            throw new Error('HTTP error ' + response.status);
        }


        const data = await response.json();
        console.log(data);

        CheckAuth(data);

    }
    catch (error){
        console.error(error);
        alert("Erreur du serveur");
    }
}

document.getElementById("connexion").addEventListener("click", login);