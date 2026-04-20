const Joi = require('joi');

const nonceSchema = Joi.object({
  address: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required()
    .messages({
      'string.pattern.base': 'Must be a valid Ethereum address',
      'any.required': 'Ethereum address is required',
    }),
});

const verifySchema = Joi.object({
  address: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required()
    .messages({
      'string.pattern.base': 'Must be a valid Ethereum address',
      'any.required': 'Ethereum address is required',
    }),
  signature: Joi.string().required().messages({
    'any.required': 'Signature is required',
  }),
});

module.exports = { nonceSchema, verifySchema };
