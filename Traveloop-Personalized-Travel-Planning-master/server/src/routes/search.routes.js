const express = require('express');
const searchController = require('../controllers/search.controller');

const router = express.Router();

router.get('/', searchController.search);
router.get('/top-destinations', searchController.getTopDestinations);
router.get('/city-activities', searchController.getCityActivities);

module.exports = router;
