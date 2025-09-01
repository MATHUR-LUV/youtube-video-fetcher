// migrations/XXXXXXXXXXXXXX-create-video.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Videos', {
      videoId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      title: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      publishedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      thumbnailUrl: {
        type: Sequelize.STRING
      },
      searchVector: {
        type: Sequelize.TSVECTOR
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('Videos', ['publishedAt']);
    await queryInterface.sequelize.query(
      `CREATE INDEX videos_search_vector_idx ON "Videos" USING gin("searchVector");`
    );

    // Add the trigger to auto-update the searchVector
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_video_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."searchVector" = to_tsvector('english', NEW.title || ' ' || NEW.description);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER video_search_vector_update
      BEFORE INSERT OR UPDATE ON "Videos"
      FOR EACH ROW EXECUTE PROCEDURE update_video_search_vector();
    `);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Videos');
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS video_search_vector_update ON "Videos";');
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS update_video_search_vector();');
  }
};