const http = require('http');

const API_URL = 'http://localhost:5000';

// Helper to make requests easily
function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING ARCHITECT VERIFICATION TESTS ---');
  
  const testEmail = `testuser_${Date.now()}@gmail.com`;
  const testPassword = 'Password123!';
  let jwtToken = null;
  let tripId = null;

  // 1. Verify Authentication Enclave Block (GET /api/trips without token)
  console.log('\n[TEST 1] Accessing protected route without JWT token...');
  try {
    const res = await makeRequest('GET', '/api/trips');
    console.log(`Response Code: ${res.status}`);
    console.log(`Response Body:`, res.body);
    if (res.status === 401) {
      console.log('✓ SUCCESS: Authentication Block successfully returned HTTP 401.');
    } else {
      console.log('✗ FAILED: Expected HTTP 401, but got:', res.status);
    }
  } catch (err) {
    console.error('✗ FAILED: Request error:', err.message);
  }

  // 2. Register User A
  console.log(`\n[TEST 2] Registering User A (${testEmail})...`);
  try {
    const res = await makeRequest('POST', '/api/auth/register', { email: testEmail, password: testPassword });
    console.log(`Response Code: ${res.status}`);
    if (res.status === 201 && res.body.token) {
      jwtToken = res.body.token;
      console.log('✓ SUCCESS: User registered, JWT obtained.');
    } else {
      console.log('✗ FAILED: Registration failed:', res.body);
    }
  } catch (err) {
    console.error('✗ FAILED: Request error:', err.message);
  }

  // 3. Create Itinerary
  console.log('\n[TEST 3] Generating 3-day itinerary for Kyoto, Japan...');
  try {
    const res = await makeRequest('POST', '/api/trips', {
      destination: 'Kyoto, Japan',
      durationDays: 3,
      budgetTier: 'Medium',
      interests: ['Culture', 'Food']
    }, jwtToken);
    
    console.log(`Response Code: ${res.status}`);
    if (res.status === 201 && res.body._id) {
      tripId = res.body._id;
      console.log('✓ SUCCESS: Trip successfully generated and saved to database.');
      console.log(`Destination: ${res.body.destination}`);
      console.log(`Total Budget: $${res.body.estimatedBudget.total}`);
      console.log(`First Hotel: ${res.body.hotels[0].name}`);
      console.log(`Packing checklist items: ${res.body.packingList.length}`);
    } else {
      console.log('✗ FAILED: Itinerary generation failed:', res.body);
    }
  } catch (err) {
    console.error('✗ FAILED: Request error:', err.message);
  }

  // 4. Toggle Packing Checklist
  if (tripId) {
    console.log('\n[TEST 4] Toggling first item on the packing checklist...');
    try {
      const getTripRes = await makeRequest('GET', '/api/trips', null, jwtToken);
      const activeTrip = getTripRes.body[0];
      const targetItem = activeTrip.packingList[0];
      
      console.log(`Toggling item: "${targetItem.item}" (Current status: isPacked=${targetItem.isPacked})`);
      
      // Update item in local list and send to PUT /api/trips/:id
      targetItem.isPacked = !targetItem.isPacked;
      
      const updateRes = await makeRequest('PUT', `/api/trips/${tripId}`, {
        packingList: activeTrip.packingList
      }, jwtToken);
      
      console.log(`Response Code: ${updateRes.status}`);
      const updatedItem = updateRes.body.packingList[0];
      console.log(`Updated item: "${updatedItem.item}" (New status: isPacked=${updatedItem.isPacked})`);
      
      if (updateRes.status === 200 && updatedItem.isPacked === targetItem.isPacked) {
        console.log('✓ SUCCESS: Packing list item state successfully toggled and updated.');
      } else {
        console.log('✗ FAILED: Packing item toggle update failed.');
      }
    } catch (err) {
      console.error('✗ FAILED: Request error:', err.message);
    }
  }

  // 5. Regenerate specific Day
  if (tripId) {
    console.log('\n[TEST 5] Regenerating Day 3 activities focusing on scenic gardens...');
    try {
      const regenRes = await makeRequest('POST', `/api/trips/${tripId}/regenerate`, {
        dayNumber: 3,
        instruction: 'Focus on scenic garden walks, tea ceremonies, and nature tours'
      }, jwtToken);
      
      console.log(`Response Code: ${regenRes.status}`);
      if (regenRes.status === 200) {
        const day3 = regenRes.body.itinerary.find(d => d.dayNumber === 3);
        console.log('✓ SUCCESS: Day 3 successfully regenerated.');
        console.log('New Day 3 Activities:');
        day3.activities.forEach((act, i) => {
          console.log(`  - Activity ${i+1}: ${act.title} [${act.timeOfDay}]`);
          console.log(`    Desc: ${act.description}`);
        });
      } else {
        console.log('✗ FAILED: Day regeneration failed:', regenRes.body);
      }
    } catch (err) {
      console.error('✗ FAILED: Request error:', err.message);
    }
  }

  // 6. Verify User Data Isolation (User B must not access User A's trips)
  const testEmailB = `testuser_B_${Date.now()}@gmail.com`;
  let jwtTokenB = null;
  
  console.log(`\n[TEST 6] Registering User B (${testEmailB}) for isolation verification...`);
  try {
    const res = await makeRequest('POST', '/api/auth/register', { email: testEmailB, password: testPassword });
    jwtTokenB = res.body.token;
    
    console.log("Listing trips for User B...");
    const tripsBRes = await makeRequest('GET', '/api/trips', null, jwtTokenB);
    console.log(`User B trip count: ${tripsBRes.body.length}`);
    
    console.log(`Trying B token on User A's Trip ID: ${tripId}...`);
    const updateBRes = await makeRequest('PUT', `/api/trips/${tripId}`, { destination: 'Hacked Destination' }, jwtTokenB);
    console.log(`Update Response Code B: ${updateBRes.status} (Expected: 404)`);
    
    if (tripsBRes.body.length === 0 && updateBRes.status === 404) {
      console.log('✓ SUCCESS: Strong User Isolation confirmed. User B has no access to User A\'s trips.');
    } else {
      console.log('✗ FAILED: User isolation breach!');
    }
  } catch (err) {
    console.error('✗ FAILED: Request error:', err.message);
  }

  console.log('\n--- VERIFICATION COMPLETED ---');
  process.exit(0);
}

runTests();
