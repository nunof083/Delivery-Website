    function Header() {
    const token = localStorage.getItem('authtoken');
    const role = localStorage.getItem('role');

    if (token !== null) {
        let username = localStorage.getItem('username');

        document.getElementById('connect').classList.add('hidden');
        document.getElementById('disconnect').classList.remove('hidden');
        document.getElementById('RoleNameHeader').textContent = role + ' : ' + username;
        document.getElementById('RoleNameHeader').classList.remove('hidden');


    }
    else  {
        document.getElementById('connect').classList.remove('hidden');
        document.getElementById('disconnect').classList.add('hidden');
        document.getElementById('RoleNameHeader').classList.add('hidden');
    }
}
function disconnect() {
    localStorage.removeItem('authtoken');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    window.location.href = './login.html';
}
window.addEventListener('load', Header);
document.getElementById('disconnect').addEventListener('click', disconnect);
