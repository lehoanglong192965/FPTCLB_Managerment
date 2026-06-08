fetch('http://localhost:8080/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'Hoang Long',
    email: 'lehoanglong19062005@gmail.com',
    password: 'Password123!',
    studentId: 'SE123456',
    major: 'SE'
  })
})
.then(res => res.json().then(data => ({status: res.status, body: data})))
.then(console.log)
.catch(console.error);
