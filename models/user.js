const mongoose = require('mongoose');

// mongoose.connect("mongodb://localhost:27017/miniBlog");
// const username = process.env.MONGODB_USERNAME;
// const password = process.env.MONGODB_PASSWORD;

// mongoose.connect(`mongodb+srv://${username}:${password}@miniblog.tvxuiyh.mongodb.net/?retryWrites=true&w=majority&appName=miniBlog`, {
//     useNewUrlParser : true,
//     useUnifiedTopology : true,
// });

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    posts: [
        { type: mongoose.Schema.Types.ObjectId, ref: "post" }
    ]
});

module.exports = mongoose.model('user', userSchema);
