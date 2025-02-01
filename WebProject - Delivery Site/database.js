import Sql from "better-sqlite3";
import bcrypt from "bcrypt";

function hashPassword(password) {
    password = bcrypt.hashSync(password, 10);
    return password;
}

function createDbEmployee() {
    const db = new Sql('./orders.db', {verbose: console.log});
    try {


        db.prepare('DROP TABLE IF EXISTS employees').run();
        db.prepare('CREATE TABLE employees (\n' +
            '    id INTEGER PRIMARY KEY AUTOINCREMENT,\n' +
            '    name VARCHAR(50) NOT NULL,\n' +
            '    firstName VARCHAR(50) NOT NULL,\n' +
            '    email TEXT NOT NULL,\n' +
            '    password TEXT NOT NULL,\n' +
            '    role VARCHAR(20) NOT NULL CHECK (role IN (\'Driver\', \'Admin\'))\n' +
            ');'
        ).run();
    }
    catch (e) {
        console.error("Failed creating table: " + e);
    }
}

function insertEmployee(name, firstName, email, password, role) {
    const db = new Sql('./orders.db', {verbose: console.log});
    db.prepare('INSERT INTO employees (name, firstName, email, password, role) VALUES (?, ?, ?, ?, ?)')
        .run(name, firstName, email, hashPassword(password), role);
}

function createDBPackages() {
    try {
        const db = new Sql('./orders.db', {verbose: console.log});
        db.prepare('DROP TABLE IF EXISTS packages').run();
        db.prepare('CREATE TABLE packages ( \n' +
            '    trackingNumber INTEGER PRIMARY KEY AUTOINCREMENT,\n' +
            '    date TEXT NOT NULL,\n' +
            '    weight Integer NOT NULL,\n' +
            '    deliveryNote VARCHAR(150),\n' +
            '    driverName VARCHAR(20) NOT NULL,\n' +
            '    driverId INTEGER,  \n' +
            '    clientId INTEGER NOT NULL, \n' +
            '    FOREIGN KEY (driverId) REFERENCES employees(id) \n' +
            ');'
        ).run();
        //ceci permet de créer une séquence dans la table sqlite_sequence pour que le trackingNumber commence à 2384675 (+1 car autoincrement)
        //attention, sqlite_sequence est une table spécifique aux valeurs d'autoincrément, si on met par ex encore une valeur
        //d'autoincrément dans la table packages, elle va prendre la valeur 2384675 également
        db.prepare('INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)').run('packages', 2384675);
        console.log("Package table created with success.");
    } catch (e) {
        console.error("Failed creating table: " + e);
    }
}
function createDBClients() {
    const db = new Sql('./orders.db', {verbose: console.log});
    try{
        db.prepare('DROP TABLE IF EXISTS clients').run();
        db.prepare('CREATE TABLE clients ( \n' +
            '   id INTEGER PRIMARY KEY AUTOINCREMENT,\n' +
            '   name VARCHAR(50) NOT NULL,\n' +
            '   email TEXT NOT NULL,\n' +
            '   address TEXT NOT NULL,\n' +
            '   phone INTEGER NOT NULL\n' +
            ');'
        ).run();

    }
    catch (e) {
        console.error("Failed creating table: " + e);
    }
}
function createDBStatus() {
    const db = new Sql('./orders.db', {verbose: console.log});
    try{
        db.prepare('DROP TABLE IF EXISTS status').run();
        db.prepare('CREATE TABLE status ( \n' +
            '   id INTEGER PRIMARY KEY AUTOINCREMENT,\n' +
            '   status VARCHAR(20) NOT NULL CHECK (status IN (\'all\', \'preparation\', \'delivery\', \'delivered\', \'problem\')),\n' +
            '   date TEXT NOT NULL,\n' +
            '   hour TEXT NOT NULL,\n' +
            '   trackingNumber INTEGER NOT NULL,\n ' +
            '   FOREIGN KEY (trackingNumber) REFERENCES packages(trackingNumber)\n' +
            ');'
        ).run();
    }
    catch (e) {
        console.log("Failed creating table: " + e);
    }
}



createDbEmployee();
createDBClients();
createDBPackages();
createDBStatus();
insertEmployee("Martin", "Jean", "admin@fastdeliver", "admin123", "Admin");
insertEmployee("Roux", "Emma", "emma@fastdeliver", "driver123", "Driver");
insertEmployee("Bernard", "Marc", "marc@fastdeliver", "driver123", "Driver");
insertEmployee("Dubois", "Lucas", "lucas@fastdeliver", "driver123", "Driver");
