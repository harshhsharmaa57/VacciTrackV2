// Test script to verify API response structure
import dotenv from 'dotenv';
dotenv.config();

const testLogin = async () => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'parent@demo.com',
      password: 'password123',
    }),
  });

  const data = await response.json();
  console.log('Response Status:', response.status);
  console.log('Response Data:', JSON.stringify(data, null, 2));
  console.log('\nUser ID field:', data.data?.user?._id || data.data?.user?.id);
  console.log('Has token:', !!data.data?.token);
};

testLogin().catch(console.error);


