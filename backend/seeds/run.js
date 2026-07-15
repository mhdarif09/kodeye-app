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

      if (existing) {
        // Update existing scenario with new fields (workspace, etc.)
        await pool.query(
          `UPDATE scenarios SET
            workspace_type = ?,
            initial_content = ?
          WHERE id = ?`,
          [
            scenario.workspace_type || 'chat',
            scenario.initial_content ? JSON.stringify(scenario.initial_content) : null,
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
