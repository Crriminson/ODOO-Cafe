const express = require('express');
const packingController = require('../controllers/packing.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createPackingSchema, updatePackingSchema } = require('../schemas/packing.schema');

const router = express.Router();

router.use(authMiddleware);

router.get('/trip/:tripId', packingController.getPackingItems);
router.post('/', validate(createPackingSchema), packingController.createPackingItem);
router.put('/:id', validate(updatePackingSchema), packingController.updatePackingItem);
router.delete('/:id', packingController.deletePackingItem);

module.exports = router;
