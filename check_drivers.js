import axios from 'axios';

const baseURL = 'logistika.api.ardentsoft.uz';
const apiURL = baseURL + 'customusers/';

async function checkDrivers() {
    try {
        console.log(`Fetching from ${apiURL}...`);
        const response = await axios.get(apiURL);
        const data = response.data.results || response.data;

        console.log(`Found ${data.length} drivers.`);
        data.forEach(driver => {
            console.log(`ID: ${driver.id}, Name: ${driver.fullname}, Photo: ${JSON.stringify(driver.photo)}`);
        });
    } catch (error) {
        console.error('Error fetching drivers:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

checkDrivers();
