const express = require('express');
const Joi = require('joi');
const { Schema } = require('mongoose');
const profileController = require('../controllers/profileController');
const authorizer = require('../middlewares/authorizer');
const validateRequest = require('../middlewares/validate-request');

const router = express.Router();

module.exports = router;

router.post('/role/user', authorizer(), profileController.getAllUser)
router.post('/role/researcher', authorizer(['admin']), profileController.getAllResearcher)
router.get('/:userid', authorizer(), profileController.getUser);
router.put('/update/:userid', authorizer(), updateProfileSchema, profileController.updateProfile);
router.delete('/delete/:userid', authorizer(['admin']), profileController.deleteUser);

function updateProfileSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string(),
    idnumber: Joi.string(),
    password: Joi.string(),
    firstname: Joi.string(),
    lastname: Joi.string(),
    birthdate: Joi.date(),
    address: Joi.string(),
    province: Joi.number(),
    district: Joi.number(),
    subdistrict: Joi.number(),
    zipcode: Joi.number(),
    role: Joi.string(),
  });
  validateRequest(req, next, schema);
}