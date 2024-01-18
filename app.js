const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();
require('dotenv').config();

const port = process.env.PORT;
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

app.use(async function(req, res, next) {
  try {
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    await req.db.query(`SET SESSION sql_mode = "TRADITIONAL"`);
    await req.db.query(`SET time_zone = '-8:00'`);
    console.log('DB Connection Made');
    await next();

    req.db.release();
  } catch (err) {
    console.log(err);

    if (req.db) req.db.release();
    throw err;
  }
});
app.use(cors());
app.use(express.json());

app.get('/cars', async function(req, res) {
    try {
        const result = await req.db.query('SELECT * FROM car WHERE deleted_flag = 0');
        const rows = result[0];
        res.json({ success: true, data: rows });
    } catch (err) {
        console.log('Error fetching data from the database');
        res.json({ success: false, message: 'Internal Server Error'});
    }
});

app.post('/car', async function(req, res) {
  try {
    const { id, make, model, year, deleted_flag } = req.body;
    const query = await req.db.query(
      `INSERT INTO car (id, make, model, year, deleted_flag) VALUES (:id, :make, :model, :year, :deleted_flag)`,
      {
        id,
        make,
        model,
        year,
        deleted_flag
      }
    );
    res.json({ success: true, message: 'Car successfully created'});
  } catch (err) {
    res.json({ success: false, message: err})
  }
});

app.put('/car/:id', async function(req,res) {
    try {
        const id = Number(req.params.id);
        const { make, model } = req.body;
        year = Number(req.body.year)
        deleted_flag = Number(req.body.deleted_flag)
        const query = await req.db.query(
          `UPDATE car SET make = :make, model = :model, year = :year, deleted_flag = :deleted_flag where id = :id`,
          {
            id,
            make,
            model,
            year,
            deleted_flag
          }
        );
        res.json({ success: true, message: 'Car successfully created'});
      } catch (err) {
        res.json({ success: false, message: 'Entry was NOT updated'})
      }
  });

app.delete('/car/:id', async function(req,res) {
    try {
        const id = Number(req.params.id);
        const query = await req.db.query(
          `UPDATE car SET deleted_flag = 1 where id = :id`,
          {id}
        );
        res.json({ success: true, message: 'Car successfully created'});
      } catch (err) {
        res.json({ success: false, message: 'Entry was NOT deleted'})
      }
});

app.listen(port, () => console.log(`212 API Example listening on http://localhost:${port}`));