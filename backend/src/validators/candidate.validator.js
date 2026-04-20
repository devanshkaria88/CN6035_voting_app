const Joi = require('joi');

const addCandidateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Candidate name is required',
    'string.max': 'Candidate name must be at most 100 characters',
    'any.required': 'Candidate name is required',
  }),
  manifesto: Joi.string().trim().min(1).max(1000).required().messages({
    'string.empty': 'Manifesto is required',
    'string.max': 'Manifesto must be at most 1000 characters',
    'any.required': 'Manifesto is required',
  }),
});

const candidateIdParam = Joi.object({
  id: Joi.number().integer().min(0).required().messages({
    'number.base': 'Candidate ID must be a number',
    'number.integer': 'Candidate ID must be an integer',
    'number.min': 'Candidate ID must be non-negative',
    'any.required': 'Candidate ID is required',
  }),
});

module.exports = { addCandidateSchema, candidateIdParam };
