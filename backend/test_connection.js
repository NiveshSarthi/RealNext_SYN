const { Sequelize } = require('sequelize');

const testPostgres = async (host, port, user, password, database) => {
    console.log(`Connecting to Postgres at ${host}:${port}...`);
    const sequelize = new Sequelize(database, user, password, {
        host: host,
        port: port,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });

    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL Connection successful!');
        return true;
    } catch (err) {
        console.log('❌ PostgreSQL Connection failed:', err.message);
        return false;
    } finally {
        await sequelize.close();
    }
};

const host = '72.61.248.175';
const port = 5448;
const user = 'root';
const password = 'CjmqvpwJAzemm4CcpcpCohYym9kp9wh8pDPnR6A8aTSP8sAjcXBi8x6ayEU3DfbV';
const database = 'postgres'; // or try to guess

testPostgres(host, port, user, password, database);
