const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

const projectsRouter = require('./projects.routes');

const port = 9000;
const rootPath = path.normalize(__dirname);

const app = express();

app.set('app', path.join(rootPath, 'app'));

app.use(bodyParser.json({ limit: '20mb' }));

app.use('/api/projects', projectsRouter);

app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: err.error || err | {}
    });
});

const url = 'mongodb://localhost:27017/projects';

MongoClient.connect(url, { useNewUrlParser: true }).then(db => {
    console.log("Database connected!");
    var dbo = db.db("projects");
    app.locals.db = dbo;
    app.listen(port, err => {
        if(err) throw err;
        console.log(`Projects API is listening on port ${port}`);
    });
}).catch(err => { 
    console.error("Error: MongoDB not available. Check that it is started on port 27017.")
    throw err;
});