const noteService = require('../services/note.service');
const apiResponse = require('../utils/apiResponse');

exports.getNotes = async (req, res, next) => {
  try {
    const notes = await noteService.getNotes(req.params.tripId, req.user.id);
    res.status(200).json(apiResponse.success(notes));
  } catch (err) {
    next(err);
  }
};

exports.createNote = async (req, res, next) => {
  try {
    const note = await noteService.createNote(req.user.id, req.body);
    res.status(201).json(apiResponse.success(note, 'Note added'));
  } catch (err) {
    next(err);
  }
};

exports.updateNote = async (req, res, next) => {
  try {
    const note = await noteService.updateNote(req.params.id, req.user.id, req.body);
    res.status(200).json(apiResponse.success(note, 'Note updated'));
  } catch (err) {
    next(err);
  }
};

exports.deleteNote = async (req, res, next) => {
  try {
    await noteService.deleteNote(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
