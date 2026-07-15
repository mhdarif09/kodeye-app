const scenarioQueries = require('../db/queries/scenarioQueries');
const AppError = require('../utils/AppError');

const parseJsonFields = (scenario) => {
  if (!scenario) return scenario;
  
  const parsed = { ...scenario };
  const jsonFields = ['tags', 'ai_criteria', 'resource_links'];
  
  jsonFields.forEach(field => {
    if (typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch (e) {
        // Leave as is if parsing fails
      }
    }
  });
  
  if (parsed.is_active !== undefined) {
    parsed.is_active = Boolean(parsed.is_active);
  }
  
  return parsed;
};

const getScenarios = async (filters) => {
  const activeFilters = { is_active: true, ...filters };
  const scenarios = await scenarioQueries.findAll(activeFilters);
  return scenarios.map(parseJsonFields);
};

const getScenarioById = async (id) => {
  const scenario = await scenarioQueries.findById(id);
  if (!scenario) throw new AppError('Scenario not found', 404, 'NOT_FOUND');
  return parseJsonFields(scenario);
};

const getScenarioBySlug = async (slug) => {
  const scenario = await scenarioQueries.findBySlug(slug);
  if (!scenario) throw new AppError('Scenario not found', 404, 'NOT_FOUND');
  return parseJsonFields(scenario);
};

module.exports = {
  getScenarios,
  getScenarioById,
  getScenarioBySlug,
};
