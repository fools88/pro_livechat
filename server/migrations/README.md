This folder is the skeleton for Sequelize migrations.

Currently empty. To create a new migration:

1. Install sequelize-cli (optional):
   npm install --save-dev sequelize-cli

2. Create migration:
   npx sequelize-cli migration:generate --name create-websites-table

3. Edit the generated migration file and then run:
   npx sequelize-cli db:migrate

Notes:
- We intentionally do not auto-run migrations in production without review.
- If you want, I can add a first migration file based on current models.
