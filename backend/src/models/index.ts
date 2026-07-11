import { Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

const dbPath = process.env.DB_PATH || './data/arch_agent.sqlite';
const dbDir = path.dirname(path.resolve(dbPath));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(dbPath),
  logging: (msg) => logger.debug(msg),
});

export { sequelize };
export default sequelize;
