
const http = require('http');

async function testApi() {
    console.log('Testing http://localhost:3000/api/dashboard/stats...');
    http.get('http://localhost:3000/api/dashboard/stats', (res) => {
        let data = '';
        console.log('Status Code:', res.statusCode);
        console.log('Headers:', res.headers);
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('Response body:', data);
        });
    }).on('error', (err) => {
        console.error('Error:', err.message);
    });
}

testApi();
