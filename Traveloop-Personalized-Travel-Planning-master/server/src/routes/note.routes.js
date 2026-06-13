const express = require('express');
const noteController = require('../controllers/note.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createNoteSchema, updateNoteSchema } = require('../schemas/note.schema');

const router = express.Router();

router.use(authMiddleware);

router.get('/trip/:tripId', noteController.getNotes);
router.post('/', validate(createNoteSchema), noteController.createNote);
router.put('/:id', validate(updateNoteSchema), noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;
