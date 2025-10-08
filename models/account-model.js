const pool = require("../database")

/* *****************************
*   Register new account
* *************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password){
  const sql = `
    INSERT INTO account (
      account_firstname,
      account_lastname,
      account_email,
      account_password,
      account_type
    )
    VALUES ($1, $2, $3, $4, 'Client')
    RETURNING account_id, account_firstname, account_lastname, account_email, account_type;
  `
  return pool.query(sql, [
    account_firstname,
    account_lastname,
    account_email,
    account_password,
  ])
}

/* **********************
 *   Check for existing email
 * ********************* */
async function checkExistingEmail(account_email){
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1"
    const email = await pool.query(sql, [account_email])
    return email.rowCount
  } catch (error) {
    return error.message
  }
}

/* **********************
 * Return account data using email address
 * ********************* */
async function getAccountByEmail(account_email){
  const sql = `
    SELECT account_id, account_firstname, account_lastname, account_email, account_password, account_type
    FROM account
    WHERE account_email = $1
    LIMIT 1;
  `
  const result = await pool.query(sql, [account_email])
  return result.rows[0] || null
}

/* **********************
 * Return account data using account_id
 * ********************* */
async function getAccountById(account_id){
  const sql = `
    SELECT account_id, account_firstname, account_lastname, account_email, account_type
    FROM account
    WHERE account_id = $1
    LIMIT 1;
  `
  const result = await pool.query(sql, [account_id])
  return result.rows[0] || null
}

/* **********************
 * Update account profile data
 * ********************* */
async function updateAccount(account_id, account_firstname, account_lastname, account_email){
  const sql = `
    UPDATE account
    SET
      account_firstname = $1,
      account_lastname = $2,
      account_email = $3
    WHERE account_id = $4
    RETURNING account_id, account_firstname, account_lastname, account_email, account_type;
  `
  const result = await pool.query(sql, [
    account_firstname,
    account_lastname,
    account_email,
    account_id,
  ])
  return result.rows[0] || null
}

/* **********************
 * Update account password hash
 * ********************* */
async function updatePassword(account_id, hashedPassword){
  const sql = `
    UPDATE account
    SET account_password = $1
    WHERE account_id = $2
    RETURNING account_id;
  `
  return pool.query(sql, [hashedPassword, account_id])
}

module.exports = {
  registerAccount,
  checkExistingEmail,
  getAccountByEmail,
  getAccountById,
  updateAccount,
  updatePassword,
}
