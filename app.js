const express = require('express');
const path = require('path');
// const mongoose = require('mongoose');
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const app = express();
require('dotenv').config();

// Middleware to parse JSON
app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Set the views directory

// Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/miniBlog', { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('Could not connect to MongoDB...', err));

const port = process.env.PORT || 3000;

const mongoose=require("mongoose")

const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;

mongoose.connect(`mongodb+srv://${username}:${password}@miniblog.tvxuiyh.mongodb.net/?retryWrites=true&w=majority&appName=miniBlog`, {
    useNewUrlParser : true,
    useUnifiedTopology : true,
});


// Middleware to check if the user is authenticated
function isLoggedIn(req, res, next) {
    if (!req.cookies.token) return res.redirect("/login");
    try {
        let data = jwt.verify(req.cookies.token, "shhhh");
        req.user = data;
        next();
    } catch (err) {
        res.redirect("/login");
    }
}


// Home route - Display all posts
app.get('/', async (req, res) => {
    try {
        let posts = await postModel.find().populate('user').sort({ date: -1 });
        res.render('show', { posts, user: req.user });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.get('/profile', isLoggedIn, async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.user.email }).populate("posts");
        let allPosts = await postModel.find().populate('user').sort({ date: -1 }); // Query all posts

        res.render("profile", { user, allPosts }); // Pass both user and allPosts to the template
    } catch (err) {
        res.status(500).send("Server error");
    }
});


// Like route - Handle post liking/unliking
app.get('/like/:id', isLoggedIn, async (req, res) => {
    try {
        let post = await postModel.findOne({ _id: req.params.id }).populate("user");

        if (post.likes.includes(req.user.userid)) {
            post.likes.pull(req.user.userid); // Unlike if already liked
        } else {
            post.likes.push(req.user.userid); // Like if not liked
        }
        await post.save();
        res.redirect("/profile");
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// Edit route - Render edit form for a post
app.get('/edit/:id', isLoggedIn, async (req, res) => {
    try {
        let post = await postModel.findOne({ _id: req.params.id }).populate("user");

        if (post.user.equals(req.user.userid)) {
            res.render("edit", { post });
        } else {
            res.status(403).send("Unauthorized");
        }
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// Update route - Handle updating a post
app.post('/update/:id', isLoggedIn, async (req, res) => {
    try {
        await postModel.findByIdAndUpdate(req.params.id, { content: req.body.content });
        res.redirect("/profile");
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// Post route - Handle creating a new post
app.post('/post', isLoggedIn, async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.user.email });
        let { content } = req.body;

        let post = await postModel.create({
            user: user._id,
            content: content
        });

        user.posts.push(post._id);
        await user.save();
        res.redirect("/profile");
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// Register route - Render registration form
app.get('/register', (req, res) => {
    res.render("register");
});

// Login route - Render login form
app.get('/login', (req, res) => {
    res.render("login");
});

// Register POST route - Handle user registration
app.post('/register', async (req, res) => {
    let { email, password, username, name, age } = req.body;

    try {
        let user = await userModel.findOne({ email });
        if (user) return res.status(500).send("User already registered");

        bcrypt.genSalt(10, (err, salt) => {
            if (err) return res.status(500).send("Server error");

            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) return res.status(500).send("Server error");

                try {
                    let user = await userModel.create({
                        username,
                        email,
                        age,
                        name,
                        password: hash
                    });
                    let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
                    res.cookie("token", token);
                    res.redirect("/"); // Redirect to home page (show.ejs) after registration
                } catch (err) {
                    res.status(500).send("Server error");
                }
            });
        });
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// Login POST route - Handle user login
app.post('/login', async (req, res) => {
    let { email, password } = req.body;

    try {
        let user = await userModel.findOne({ email });
        if (!user) return res.status(500).send("Something went wrong");

        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
                res.cookie("token", token);
                res.redirect("/profile"); // Redirect to profile page after login
            } else {
                res.redirect("/login");
            }
        });
    } catch (err) {
        res.status(500).send("Server error");
    }
});


// Logout route - Clear cookie and redirect to login
app.get('/logout', (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});

// Start the server
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
