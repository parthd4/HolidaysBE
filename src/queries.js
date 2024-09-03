const Pool = require('pg').Pool;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

const getUsers = (request, response) => {
  pool.query('SELECT * FROM users', (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results.rows);
  });
};

const getUser = async (id) => {
  return new Promise((resolve, reject) =>
    pool.query('SELECT * FROM users WHERE id = $1', [id], (error, results) => {
      if (error) {
        return reject(error);
      }
      return resolve(results.rows[0]);
    }),
  );
};

const addOrUpdateUser = (id, access_token, refresh_token, expires) => {
  pool.query(
    `INSERT INTO users (id, access_token, refresh_token, expires)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT(id)
    DO UPDATE SET
      access_token = $2, refresh_token = $3, expires = $4`,
    [id, access_token, refresh_token, expires],
    (error, results) => {
      if (error) {
        throw error;
      }
    },
  );
};

module.exports = {
  getUser,
  getUsers,
  addOrUpdateUser,
};
