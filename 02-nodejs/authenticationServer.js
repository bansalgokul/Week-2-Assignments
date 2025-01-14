/**
  You need to create a HTTP server in Node.js which will handle the logic of an authentication server.
  - Don't need to use any database to store the data.

  - Save the users and their signup/login data in an array in a variable
  - You can store the passwords in plain text (as is) in the variable for now

  The expected API endpoints are defined below,
  1. POST /signup - User Signup
    Description: Allows users to create an account. This should be stored in an array on the server, and a unique id should be generated for every new user that is added.
    Request Body: JSON object with email, password, firstName and lastName fields.
    Response: 201 Created if successful, or 400 Bad Request if the email already exists.
    Example: POST http://localhost:3000/signup

  2. POST /login - User Login
    Description: Gets user back their details like firstname, lastname and id
    Request Body: JSON object with email and password fields.
    Response: 200 OK with an authentication token in JSON format if successful, or 401 Unauthorized if the credentials are invalid.
    Example: POST http://localhost:3000/login

  3. GET /data - Fetch all user's names and ids from the server (Protected route)
    Description: Gets details of all users like firstname, lastname and id in an array format. Returned object should have a key called users which contains the list of all users with their email/firstname/lastname.
    The users email and password should be fetched from the headers and checked before the array is returned
    Response: 200 OK with the protected data in JSON format if the email and password in headers are valid, or 401 Unauthorized if the email and password are missing or invalid.
    Example: GET http://localhost:3000/data

  - For any other route not defined in the server return 404

  Testing the server - run `npm run test-authenticationServer` command in terminal
 */

const express = require("express")
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const PORT = 3000;
const app = express();
// write your logic here, DONT WRITE app.listen(3000) when you're running tests, the tests will automatically start the server

const users = [];
const salt = bcrypt.genSaltSync(10);
const secretKey = 'mySecretKey';

app.use(bodyParser.json())

app.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  const userFound = users.find(user => user.email === email);
  if (userFound) {
    res.status(400).send("User already exist. Please login");
  }
  const encPassword = await bcrypt.hash(password, salt);
  const maxId = users.length === 0 ? 1 : Math.max(...users.map(user => user.id));
  const user = {
    firstName,
    lastName,
    email,
    password: encPassword,
    id: maxId,
  }

  users.push(user);
  res.status(201).send('Signup successful');
})

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (email && password) {
    const userFound = users.find(user => user.email === email);
    if (userFound) {
      const result = await bcrypt.compare(password, userFound.password);
      if (result == true) {
        const token = jwt.sign({ email, password }, secretKey);
        const response = {
          token,
          email: userFound.email,
          firstName: userFound.firstName,
          lastName: userFound.lastName
        }
        res.status(200).json(response);
      } else {
        res.status(401).send("Unauthorized");
      }
    } else {
      res.status(404).send('User not found');
    }

  } else {
    res.status(400).send("email and password required");
  }

})

app.get('/data', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).send("Unauthorized");
  }
  const decodedToken = await jwt.decode(token);
  const { email, password } = decodedToken;
  console.log(decodedToken);
  if (email && password) {
    const userFound = users.find(user => user.email === email);
    if (userFound) {
      const result = await bcrypt.compare(password, userFound.password);
      if (result) {
        res.json({ users });
      } else {
        res.status(401).send("password invalid");
      }
    } else {
      res.status(401).send("User not found")
    }
  } else {
    res.status(401).send("User not found")
  }


})

// app.listen(4000);
module.exports = app;
