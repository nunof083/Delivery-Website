import express from 'express';
import sql from 'better-sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sanitizeHtml from 'sanitize-html';

const app = express();
const AccessTokenSecret = 'X303Aegis';
const RefreshToken = 'GN-003Kyrios';

app.use(express.json());
app.use(express.static('public'));


function statusMapping(statusData) {
    const statusMapping = {
        'preparation': 1,
        'delivery': 2,
        'delivered': 3,
        'problem': 4
    }
    return statusMapping[statusData.status];
}

function splitDriverName(packageData) {
    if (packageData.driverName.includes('-')) {
        const driverNameSplited = packageData.driverName.split('-');
        packageData.driverName =
            driverNameSplited[0][0].toUpperCase() +
            driverNameSplited[0].slice(1).toLowerCase() +
            ' ' +
            driverNameSplited[1][0].toUpperCase() +
            driverNameSplited[1].slice(1).toLowerCase();
        //ce code permet de séparer le nom du prénom du driver et de les mettre en majuscule (ex: roux-emma => Roux Emma)
        //et si on n'a pas assigné de livreur, on met Non assigné
    } else {
        packageData.driverName = 'Non assigné';
    }
}

let driverId = null;
function splitDriverNameAndGetId(packageData, db) {
    if (packageData.driverName !== 'non-assigned' && packageData.driverName.includes('-')) {
        const driverSplited = packageData.driverName.split('-');
        const driverNameComplete = driverSplited[0][0].toUpperCase() + driverSplited[0].slice(1).toLowerCase();

        const driver = db.prepare('SELECT id FROM employees WHERE name = ?').get(driverNameComplete);
        driverId = driver.id || null; //le code d'en dessous est le même que celui là
        /*if (driver) {
            driverId = driver.id
        } else {
            driverId = null;
        }*/
        //ce code permet de vérifier si le driver existe dans la db, si oui, on récupère son premier nom (ex: roux-emma => Roux)
        //et on récupère son id, si non, on met l'id à null
    } else {
        driverId = null;
    }
}

function nonAssignedDriver(packageData) {
    if (packageData.driverName === 'Non Assigned') {
        packageData.driverName = 'Non assigné';
    }
    //permet de passer dans l'api get le Non Assigned en français
}

function sortStatusByDateAndHour(packageData, selectStatus) {
    return selectStatus
        .filter((status) => status.trackingNumber === packageData.trackingNumber)
        .sort((a, b) => new Date(`${b.date} ${b.hour}`) - new Date(`${a.date} ${a.hour}`))[0];
}

app.get('/', (req, res)=>{
   res.sendFile('index.html');
})

app.get('/packages', (req, res) => {
    const db = new sql('./orders.db', { verbose: console.log });
    try {
        const selectPackages = db.prepare('SELECT * FROM packages').all();
        const selectClients = db.prepare('SELECT * FROM clients').all();
        const selectStatus = db.prepare('SELECT * FROM status').all();

        //ceci permet de créer un tableau qui contient les données des packages, des clients et des status
        //on fait ceci en comparant les id des clients et des packages et les trackingNumber des packages et des status
        const packages = selectPackages.map((packageData) => {
            const clientData = selectClients.find((client) => client.id === packageData.clientId);
            const statusData = sortStatusByDateAndHour(packageData, selectStatus);
            splitDriverName(packageData);
            nonAssignedDriver(packageData);
            return { packageData, clientData, statusData };
        });
       res.json(packages);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/packages/FD:id([a-zA-Z0-9]+)BE', (req, res) => {
    const db = new sql('./orders.db', {verbose: console.log});
    const trackingNumber = req.params.id;
    try {
        const packageData = db.prepare('SELECT * FROM packages WHERE trackingNumber = ?').get(trackingNumber);
        const clientData = db.prepare('SELECT * FROM clients WHERE id = ?').get(packageData.clientId);
        const selectStatus = db.prepare('SELECT * FROM status').all();
        const statusData = sortStatusByDateAndHour(packageData, selectStatus);
        splitDriverName(packageData);
        nonAssignedDriver(packageData);
        if (packageData && clientData && statusData) {
            res.json({ packageData, clientData, statusData });
        }
        else {
            res.status(404).json({ message: 'Package not found' });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/users', async (req, res) => {
    const db = new sql('./orders.db', {verbose: console.log});
    const {email, password} = req.body;

    try {
        const userdata = db.prepare('SELECT * FROM employees WHERE email = ?').get(email);
        console.log(userdata)
        if (userdata) {
            if ( await bcrypt.compare(password, userdata.password)) {
                const token = jwt.sign({email}, AccessTokenSecret, {expiresIn: '1h'});
                const username = userdata.firstName + ' ' + userdata.name;
                const role = userdata.role;
                const id = userdata.id;
                    res.json(
                        {
                        message: 'User authenticated',
                        token: token,
                        role: role,
                        username: username,
                        id : id
                        });
            }
            else
            {
                res.status(401).json({message: 'Wrong email or password'});
            }

        } else {
            res.json({message: 'User not found'});
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
});

app.post('/packages', (req, res) => {
    const db = new sql('./orders.db', { verbose: console.log });
    const { packageData, clientData, statusData } = req.body;

    try {
        splitDriverNameAndGetId(packageData, db);

        let client = db.prepare('SELECT id FROM clients WHERE email = ?').get(clientData.email);
        let clientId;

        //insert client data
        if (client) {
            clientId = client.id;
        } else {
            const clientResult = db.prepare(`
                INSERT INTO clients (name, email, address, phone)
                VALUES (?, ?, ?, ?)
            `).run(
                clientData.name,
                clientData.email,
                clientData.address,
                clientData.phone
            );
            clientId = clientResult.lastInsertRowid;
        }

        //insert package data
        const packageResult = db.prepare(`
            INSERT INTO packages (date, weight, deliveryNote, driverName, driverId, clientId)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            packageData.date,
            packageData.weight,
            packageData.deliveryNote,
            packageData.driverName,
            driverId,
            clientId
        );

        const trackingNumber = packageResult.lastInsertRowid;

        //insert status data
        db.prepare(`
            INSERT INTO status (status, date, hour, trackingNumber) 
            VALUES (?, ?, ?, ?)
        `).run(
            statusData.status,
            statusData.date,
            statusData.hour,
            trackingNumber
        );

        res.json({ message: 'Package created successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
});


app.put('/packages/FD:id([a-zA-Z0-9]+)BE', (req, res) => {
    const db = new sql('./orders.db', { verbose: console.log });
    const trackingNumber = req.params.id;
    const { packageData, clientData, statusData } = req.body;

    try {
        const selectStatus = db.prepare('SELECT * FROM status').all();
        const selectPackage = db.prepare('SELECT * FROM packages WHERE trackingNumber = ?').get(trackingNumber);
        const latestStatus = sortStatusByDateAndHour(selectPackage, selectStatus);


        splitDriverNameAndGetId(packageData, db);

        //update client data
        db.prepare(`
            UPDATE clients 
            SET name = ?, email = ?, address = ?, phone = ? 
            WHERE id = (
                SELECT clientId 
                FROM packages 
                WHERE trackingNumber = ?
            )
        `).run(
            clientData.name,
            clientData.email,
            clientData.address,
            clientData.phone,
            trackingNumber
        );

        //update package data
        db.prepare(`
            UPDATE packages 
            SET date = ?, weight = ?, deliveryNote = ?, driverName = ?, driverId = ? 
            WHERE trackingNumber = ?
        `).run(
            packageData.date,
            packageData.weight,
            packageData.deliveryNote,
            packageData.driverName,
            driverId,
            trackingNumber
        );

        const statusId = statusMapping(statusData);
        console.log(latestStatus);

        if (statusData.status === latestStatus.status) {
            //update status data
            db.prepare(`
                UPDATE status 
                SET status = ?, date = ?, hour = ? 
                WHERE trackingNumber = ? AND id = ?
            `).run(
                statusData.status,
                statusData.date,
                statusData.hour,
                trackingNumber,
                statusId
            );
        } else {
            //insert status data
            db.prepare(`
                INSERT INTO status (status, date, hour, trackingNumber)
                VALUES (?, ?, ?, ?)
            `).run(
                statusData.status,
                statusData.date,
                statusData.hour,
                trackingNumber
            );
        }
        res.json({ message: 'Package updated successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
});


app.delete('/packages/FD:id([a-zA-Z0-9]+)BE', (req, res) => {
    const db = new sql('./orders.db', { verbose: console.log });
    const trackingNumber = req.params.id;

    try {
        db.prepare('DELETE FROM status WHERE trackingNumber = ?').run(trackingNumber);
        db.prepare('DELETE FROM packages WHERE trackingNumber = ?').run(trackingNumber);
        db.prepare('DELETE FROM clients WHERE id = (SELECT clientId FROM packages WHERE trackingNumber = ?)').run(trackingNumber);
        res.json({ message: 'Package deleted successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/drivers/:id/packages', (req, res )  =>
{
      const db = new sql('./orders.db', { verbose: console.log });
      const driverId = req.params.id;
      try {
          const query =
               `   SELECT packages.trackingNumber,
                          packages.date   AS packageDate,
                          packages.weight,
                          packages.deliveryNote,
                          packages.driverName,
                          packages.driverId,
                          clients.name    AS clientName,
                          clients.email   AS clientEmail,
                          clients.address AS clientAddress,
                          clients.phone   AS clientPhone,
                          status.status,
                          status.date,
                          status.hour
                   FROM packages
                            LEFT JOIN clients ON packages.clientId = clients.id
                            LEFT JOIN status ON packages.trackingNumber = status.trackingNumber
                   WHERE packages.driverId = ?
                     AND status.status NOT IN ('delivered', 'problem')
                     AND (status.date, status.hour) = (
                     SELECT MAX(date), MAX(hour)
                     FROM status
                     WHERE status.trackingNumber = packages.trackingNumber
                     )
                   GROUP BY packages.trackingNumber;`;

          const packages = db.prepare(query).all(driverId);
          res.json({packages});
      }
  catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Request error' });
  }
});

app.post('/status', (req, res) => {
    const db = new sql('./orders.db', { verbose: console.log });
    const { status, date, hour, trackingNumber } = req.body;

    if (!status || !date || !hour || !trackingNumber) {
        return res.status(400).json({ message: 'Missing required fields' });
    } else {
        if (status === "delivered" || status === "problem") {
            try {
                // Insert the status into the database
                db.prepare(`Insert into status (status, date, hour, trackingNumber) VALUES (?, ?, ?, ?)`).
                run(status, date, hour, trackingNumber);

                // Fetch the latest status after inserting
                const updatedStatus = db.prepare(`
                    SELECT * FROM status
                    WHERE trackingNumber = ?
                    ORDER BY date DESC, hour DESC
                    LIMIT 1
                `).get(trackingNumber);

                // Send the updated status back
                res.json({ message: 'Status updated successfully', updatedStatus });

            } catch (e) {
                console.error(e);
                res.status(500).json({ message: 'Failed to insert into the database' });
            }
        } else {
            res.status(400).json({ message: 'Invalid status' });
        }
    }
});


app.get('/status/FD:id([a-zA-Z0-9]+)BE', (req, res) => {
    const db = new sql('./orders.db', { verbose: console.log });
    const trackingNumber = req.params.id;
    try {
        const query = `SELECT status, date, hour FROM status WHERE trackingNumber = ? ORDER BY date DESC, hour DESC`;
        const statuses = db.prepare(query).all(trackingNumber);
        if (statuses.length === 0) {
            return res.status(404).json({message: 'Status not found'});
        }
        res.json({statuses});
    }
    catch (e) {
        console.error(e);
        res.status(500).json({message: 'Request error'});
    }
});



app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
