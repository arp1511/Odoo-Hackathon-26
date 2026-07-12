async function testAuth() {
  try {
    // 1. Register a new user
    console.log('Registering manager2@transitops.com...');
    const regRes = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Manager 2',
        email: 'manager2@transitops.com',
        password: 'password123',
        role: 'FLEET_MANAGER'
      })
    });
    console.log('Register status:', regRes.status);
    console.log('Register body:', await regRes.text());

    // 2. Login
    console.log('Logging in with manager2@transitops.com...');
    const loginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager2@transitops.com',
        password: 'password123'
      })
    });
    console.log('Login status:', loginRes.status);
    console.log('Login body:', await loginRes.text());
    
    // 3. Login with original manager
    console.log('Logging in with manager@transitops.com...');
    const loginRes2 = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager@transitops.com',
        password: 'password123'
      })
    });
    console.log('Login2 status:', loginRes2.status);
    console.log('Login2 body:', await loginRes2.text());
  } catch (err) {
    console.error(err);
  }
}
testAuth();
