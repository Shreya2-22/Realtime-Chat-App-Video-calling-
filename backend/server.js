import express from 'express';

const app=express()

app.get('/api/auth/signup', (req, res) => {
    res.send('Signup Route');
});

app.get('/api/auth/login', (req, res) => {
    res.send('Login Route');
});

app.get('/api/auth/logout', (req, res) => {
    res.send('Logout Route');
});

app.listen(5001, ()=>{
    console.log("Server is running on port 5001");
})