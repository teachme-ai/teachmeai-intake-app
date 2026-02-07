const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'default_secret';
const payload = {
    name: "Test User",
    email: "test@example.com",
    role: "Software Engineer",
    goal: "Learn AI Agents",
    challenge: "I want to build a complex agent system but I don't know where to start."
};

const token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log(token);
