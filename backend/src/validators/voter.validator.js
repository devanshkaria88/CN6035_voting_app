const Joi = require('joi');

const ethereumAddress = Joi.string()
  .pattern(/^0x[a-fA-F0-9]{40}$/)
  .required()
  .messages({
    'string.pattern.base': 'Must be a valid Ethereum address (0x followed by 40 hex characters)',
    'any.required': 'Ethereum address is required',
  });

const registerVoterSchema = Joi.object({
  address: ethereumAddress,
});

const batchRegisterSchema = Joi.object({
  addresses: Joi.array()
    .items(
      Joi.string()
        .pattern(/^0x[a-fA-F0-9]{40}$/)
        .messages({
          'string.pattern.base': 'Each entry must be a valid Ethereum address',
        })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one address is required',
      'any.required': 'Addresses array is required',
    }),
});

const voteSchema = Joi.object({
  candidateId: Joi.number().integer().min(0).required().messages({
    'number.base': 'Candidate ID must be a number',
    'number.integer': 'Candidate ID must be an integer',
    'number.min': 'Candidate ID must be non-negative',
    'any.required': 'Candidate ID is required',
  }),
});

const voterAddressParam = Joi.object({
  address: ethereumAddress,
});

module.exports = {
  registerVoterSchema,
  batchRegisterSchema,
  voteSchema,
  voterAddressParam,
};
