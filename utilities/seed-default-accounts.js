const bcrypt = require("bcryptjs")
const pool = require("../database")

const defaultAccounts = [
  {
    account_firstname: "Basic",
    account_lastname: "Client",
    account_email: "basic@340.edu",
    account_type: "Client",
    // Matches assignment instructions.
    plainPassword: "I@mABas1cCl!3nt",
  },
  {
    account_firstname: "Happy",
    account_lastname: "Employee",
    account_email: "happy@340.edu",
    account_type: "Employee",
    plainPassword: "I@mAnEmpl0y33",
  },
  {
    account_firstname: "Manager",
    account_lastname: "User",
    account_email: "manager@340.edu",
    account_type: "Admin",
    plainPassword: "I@mAnAdm!n1strat0r",
  },
]

async function ensureDefaultAccounts() {
  for (const account of defaultAccounts) {
    const existing = await pool.query(
      "SELECT account_id FROM account WHERE account_email = $1 LIMIT 1",
      [account.account_email]
    )

    if (existing.rowCount) {
      // Keep any user-set passwords; only refresh profile details and role.
      await pool.query(
        `
          UPDATE account
          SET
            account_firstname = $1,
            account_lastname = $2,
            account_type = $3
          WHERE account_email = $4;
        `,
        [
          account.account_firstname,
          account.account_lastname,
          account.account_type,
          account.account_email,
        ]
      )
    } else {
      const hashedPassword = await bcrypt.hash(account.plainPassword, 10)
      await pool.query(
        `
          INSERT INTO account (
            account_firstname,
            account_lastname,
            account_email,
            account_password,
            account_type
          )
          VALUES ($1, $2, $3, $4, $5);
        `,
        [
          account.account_firstname,
          account.account_lastname,
          account.account_email,
          hashedPassword,
          account.account_type,
        ]
      )
    }
  }
}

module.exports = {
  ensureDefaultAccounts,
  defaultAccounts,
}
