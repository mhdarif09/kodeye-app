const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('../src/db/mysql');
const scenarioQueries = require('../src/db/queries/scenarioQueries');
const logger = require('../src/utils/logger');

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

const categoryToSkill = {
  'architecture':            'SYSTEM_DESIGN',
  'technical-communication': 'TECHNICAL_COMMUNICATION',
  'debugging':               'DEBUGGING',
  'negotiation':             'NEGOTIATION',
  'stakeholder-management':  'STAKEHOLDER_MANAGEMENT',
  'career-growth':           'MENTORING',
  'interview-prep':          'INTERVIEW_PREP',
};

const runSeed = async () => {
  try {
    logger.info('Starting scenario seeding...');
    
    const filePath = path.join(__dirname, 'data', 'scenarios.json');
    const rawData = fs.readFileSync(filePath, 'utf8');
    const scenarios = JSON.parse(rawData);
    
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const scenario of scenarios) {
      const slug = generateSlug(scenario.title);

      const existing = await scenarioQueries.findBySlug(slug);

      const skillCategory = categoryToSkill[scenario.category] || null;
      const hasProblem = !!(scenario.initial_content && scenario.initial_content.problem);

      if (existing) {
        // Update existing scenario
        await pool.query(
          `UPDATE scenarios SET
            workspace_type = ?,
            initial_content = ?,
            skill_category = ?,
            has_problem = ?,
            title_id = ?,
            role_a_name_id = ?,
            role_b_name_id = ?,
            role_a_briefing_id = ?,
            role_b_briefing_id = ?
          WHERE id = ?`,
          [
            scenario.workspace_type || 'chat',
            scenario.initial_content ? JSON.stringify(scenario.initial_content) : null,
            skillCategory,
            hasProblem,
            scenario.title_id || null,
            scenario.role_a_name_id || null,
            scenario.role_b_name_id || null,
            scenario.role_a_briefing_id || null,
            scenario.role_b_briefing_id || null,
            existing.id,
          ]
        );
        updatedCount++;
        continue;
      }
      
      const scenarioData = {
        id: uuidv4(),
        title: scenario.title,
        slug,
        mode: scenario.mode,
        category: scenario.category,
        difficulty: scenario.difficulty,
        tags: JSON.stringify(scenario.tags),
        role_a_briefing: scenario.role_a_briefing,
        role_a_secret_objective: scenario.role_a_secret_objective,
        role_a_name: scenario.role_a_name || null,
        role_b_briefing: scenario.role_b_briefing,
        role_b_secret_objective: scenario.role_b_secret_objective,
        role_b_name: scenario.role_b_name || null,
        ai_criteria: JSON.stringify(scenario.ai_criteria),
        resource_links: JSON.stringify(scenario.resource_links),
        workspace_type: scenario.workspace_type || 'chat',
        initial_content: scenario.initial_content ? JSON.stringify(scenario.initial_content) : null,
        skill_category: skillCategory,
        has_problem: hasProblem,
        title_id: scenario.title_id || null,
        role_a_name_id: scenario.role_a_name_id || null,
        role_b_name_id: scenario.role_b_name_id || null,
        role_a_briefing_id: scenario.role_a_briefing_id || null,
        role_b_briefing_id: scenario.role_b_briefing_id || null,
      };

      await scenarioQueries.insertScenario(scenarioData);
      insertedCount++;
      logger.info(`Inserted scenario: ${scenario.title}`);
    }

    logger.info(`Seeding complete. Inserted: ${insertedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`);
    console.log(`Seeding complete. Inserted: ${insertedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`);
  } catch (error) {
    logger.error('Failed to seed scenarios', error);
    console.error('Failed to seed scenarios', error);
  } finally {
    await pool.end();
  }
};

runSeed();
