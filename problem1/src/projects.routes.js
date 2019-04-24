const express = require('express');
const mongodb = require('mongodb');
const ObjectID = mongodb.ObjectID;
const indicative = require('indicative');
const { rule } = require('indicative')

const router = express.Router();

router.get('/', (req, res) => {
    const db = req.app.locals.db;
    db.collection('projects').find().toArray().then(projects => {
        res.json(projects);
    });
});

router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const project = req.body;
    if (!project.status) {
        project.status = 'suggested'
    }

    indicative.validate(project, {
        id: 'regex:^[0-9a-f]{24}$',
        date: 'required|date',
        pseudonims: [
            rule('required'),
            rule('regex', /[A-z0-9, ]+/)
          ],
        name: 'required',
        gitHubUrl: 'required|url',
        description: 'required',
        keywords: [
            rule('regex', /[A-z0-9, ]+/)
          ],
        status: 'in:suggested,accepted'
    }).then(project => {
        console.log('Validated ', project);
        db.collection('projects').insertOne(project).then(result => {
            if (result.result.ok && result.insertedCount === 1) {
                const uri = req.baseUrl + '/' + project._id
                res.location(uri).status(201).json(project);
            }
        }).catch(err => {
            res.status(400)
                .json({
                    message: 'Adding project failed: ' + err.errmsg,
                    error: err || {}
                });
        });
    }).catch(err => {
        res.status(400)
            .json({
                message: 'Invalid project: ' + err[0].message,
                error: err || {}
            });
    });
});

router.get('/:id', (req, res) => {
    const db = req.app.locals.db;
    const id = req.params.id;

    indicative.validate(req.params, {
        id: 'required|regex:^[0-9a-f]{24}$'
    }).then(() => {
        db.collection('projects').findOne({ _id: new ObjectID(id) })
            .then(project => {
                if (project) {
                    res.json(project);
                } else {
                    res.status(404)
                        .json({
                            message: 'Project not found!',
                            error: {}
                        });
                }
            });
    }).catch(err => {
        res.status(400)
            .json({
                message: 'Invalid project ID: ' + id,
                error: err || {}
            });
    });
});

router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const id = req.params.id;
    const project = req.body;
    if (id !== project.id) {
        res.status(400)
            .json({
                message: 'Project ID and url ID doesn\'t match',
                error: {}
            });
    }
    indicative.validate(project, {
        id: 'regex:^[0-9a-f]{24}$',
        date: 'required|date',
        pseudonims: [
            rule('required'),
            rule('regex', /[A-z0-9, ]+/)
        ],
        name: 'required',
        gitHubUrl: 'required|url',
        description: 'required',
        keywords: [
            rule('regex', /[A-z0-9, ]+/)
        ],
        status: 'in:suggested,accepted'
    })
        .then(project => {
            project._id = new ObjectID(project.id);
            delete (project.id);
            db.collection('projects').updateOne({ _id: project._id }, { "$set": project })
                .then(result => {
                    if (result.result.ok) {
                        res.status(200).json(project);
                    }
                }).catch(err => {
                    res.status(400)
                        .json({
                            message: 'Updating project failed: ' + err.errmsg,
                            error: err || {}
                        });
                });
        }).catch(err => {
            res.status(400)
                .json({
                    message: 'Invalid project: ' + err[0].message,
                    error: err || {}
                });
        });
});

router.delete('/:id', function (req, res) {
    const db = req.app.locals.db;
    const id = req.params.id;

    indicative.validate(req.params, { id: 'required|regex:^[0-9a-f]{24}$' })
        .then(() => {
            db.collection('projects').findOneAndDelete({ _id: new ObjectID(id) })
                .then(({ value }) => {
                    if (value) {
                        res.json(value);
                    } else {
                        res.status(404)
                            .json({
                                message: 'Invalid project ID: ' + id,
                                error: {}
                            });
                    }
                });
        }).catch(err => {
            res.status(400)
                .json({
                    message: 'Invalid project ID: ' + id,
                    error: err || {}
                });
        });
});

module.exports = router;