const express = require('express');
const scenarioService = require('../services/scenarioService');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, difficulty, mode } = req.query;
    const filters = {};
    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;
    if (mode) filters.mode = mode;

    const scenarios = await scenarioService.getScenarios(filters);
    res.status(200).json({ data: scenarios });
  } catch (error) {
    next(error);
  }
});

router.get('/:idOrSlug', async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    let scenario;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(idOrSlug)) {
      scenario = await scenarioService.getScenarioById(idOrSlug);
    } else {
      scenario = await scenarioService.getScenarioBySlug(idOrSlug);
    }

    res.status(200).json({ data: scenario });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
