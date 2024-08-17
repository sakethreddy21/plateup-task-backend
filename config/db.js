const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    dialectModule: require('pg'),
    
})


 
module.exports = pool
