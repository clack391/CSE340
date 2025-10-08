/* ********************************
 * Account Controller
 * ******************************** */

const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const utilities = require("../utilities")
const accountModel = require("../models/account-model")

function issueAccountToken(payload) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined.")
  }
  return jwt.sign(payload, secret, { expiresIn: "1h" })
}

/* ********************************
 * Deliver login view
 * ******************************** */
async function buildLogin(req, res) {
  const nav = await utilities.getNav()
  res.render("account/login", {
    title: "Login",
    nav,
    errors: null,
  })
}

/* ********************************
 * Deliver registration view
 * ******************************** */
async function buildRegister(req, res) {
  const nav = await utilities.getNav()
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null,
  })
}

/* ********************************
 * Process registration
 * ******************************** */
async function registerAccount(req, res) {
  const nav = await utilities.getNav()
  const {
    account_firstname,
    account_lastname,
    account_email,
    account_password,
  } = req.body

  try {
    const hashedPassword = await bcrypt.hash(account_password, 10)
    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword
    )

    if (regResult && regResult.rowCount) {
      req.flash(
        "notice",
        `Congratulations, you're registered ${account_firstname}. Please log in.`
      )
      return res.status(201).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }
  } catch (error) {
    console.error("Registration failed:", error)
  }

  req.flash("notice", "Sorry, the registration failed.")
  return res.status(500).render("account/register", {
    title: "Register",
    nav,
    errors: null,
    account_firstname,
    account_lastname,
    account_email,
  })
}

/* ********************************
 * Process the login attempt
 * ******************************** */
async function accountLogin(req, res) {
  const nav = await utilities.getNav()
  const { account_email, account_password } = req.body

  try {
    const accountData = await accountModel.getAccountByEmail(account_email)
    if (!accountData) {
      req.flash("notice", "Please check your credentials and try again.")
      return res.status(401).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }

    const passwordsMatch = await bcrypt.compare(
      account_password,
      accountData.account_password
    )

    if (!passwordsMatch) {
      req.flash("notice", "Please check your credentials and try again.")
      return res.status(401).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }

    delete accountData.account_password

    try {
      const token = issueAccountToken(accountData)

      res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
      })
      res.locals.loggedin = true
      res.locals.accountData = accountData

      req.flash("notice", "You are now logged in.")
      return res.redirect("/account")
    } catch (err) {
      console.error("Login token issuance failed:", err)
      req.flash(
        "notice",
        "Authentication is temporarily unavailable. Please contact support."
      )
      return res.status(500).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }
  } catch (error) {
    console.error("Login failed:", error)
    req.flash("notice", "Sorry, something went wrong logging you in.")
    return res.status(500).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    })
  }
}

/* ********************************
 * Deliver account management view
 * ******************************** */
async function buildAccountManagement(req, res) {
  const nav = await utilities.getNav()
  res.render("account/management", {
    title: "Account Management",
    nav,
    errors: null,
  })
}

/* ********************************
 * Deliver account update view
 * ******************************** */
async function buildUpdateAccount(req, res) {
  const nav = await utilities.getNav()
  const accountId = Number(req.params.accountId)

  if (
    !res.locals.accountData ||
    (res.locals.accountData.account_id !== accountId &&
      !["Admin", "Employee"].includes(res.locals.accountData.account_type))
  ) {
    req.flash("notice", "You do not have access to update this account.")
    return res.redirect("/account")
  }

  const account = await accountModel.getAccountById(accountId)
  if (!account) {
    req.flash("notice", "Account not found.")
    return res.redirect("/account")
  }

  res.render("account/update", {
    title: `Update ${account.account_firstname}`,
    nav,
    account,
    errors: null,
    passwordErrors: null,
  })
}

/* ********************************
 * Process account update
 * ******************************** */
async function updateAccount(req, res) {
  const nav = await utilities.getNav()
  const { account_id, account_firstname, account_lastname, account_email } =
    req.body

  const requester = res.locals.accountData
  if (
    !requester ||
    (Number(requester.account_id) !== Number(account_id) &&
      !["Admin", "Employee"].includes(requester.account_type))
  ) {
    req.flash("notice", "You do not have permission to update that account.")
    return res.redirect("/account")
  }

  try {
    const updatedAccount = await accountModel.updateAccount(
      account_id,
      account_firstname,
      account_lastname,
      account_email
    )

    if (!updatedAccount) {
      req.flash("notice", "Account could not be updated.")
      const account = await accountModel.getAccountById(account_id)
      return res.status(500).render("account/update", {
        title: "Update Account",
        nav,
        errors: null,
        account_firstname,
        account_lastname,
        account_email,
        account: account || { account_id },
        passwordErrors: null,
      })
    }

    try {
      const token = issueAccountToken(updatedAccount)

      res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
      })
      res.locals.accountData = updatedAccount

      req.flash("notice", "Account information updated.")
      return res.redirect("/account")
    } catch (err) {
      console.error("Account update token issuance failed:", err)
      req.flash(
        "notice",
        "Account updated, but authentication token could not be refreshed. Please log in again."
      )
      res.clearCookie("jwt")
      return res.redirect("/account/login")
    }
  } catch (error) {
    console.error("Account update failed:", error)
    req.flash("notice", "Account could not be updated.")
    const account = await accountModel.getAccountById(account_id)
    return res.status(500).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      account_firstname,
      account_lastname,
      account_email,
      account: account || { account_id },
      passwordErrors: null,
    })
  }
}

/* ********************************
 * Process password change
 * ******************************** */
async function updatePassword(req, res) {
  const nav = await utilities.getNav()
  const { account_id, account_password } = req.body

  const requester = res.locals.accountData
  if (
    !requester ||
    (Number(requester.account_id) !== Number(account_id) &&
      !["Admin", "Employee"].includes(requester.account_type))
  ) {
    req.flash("notice", "You do not have permission to update that password.")
    return res.redirect("/account")
  }

  try {
    const hashedPassword = await bcrypt.hash(account_password, 10)
    const updateResult = await accountModel.updatePassword(
      account_id,
      hashedPassword
    )

    if (!updateResult || !updateResult.rowCount) {
      req.flash("notice", "Password could not be updated.")
      return res.status(500).render("account/update", {
        title: "Update Account",
        nav,
        errors: null,
        passwordErrors: null,
        account: { account_id },
      })
    }

    const account = await accountModel.getAccountById(account_id)
    if (account) {
      try {
        const token = issueAccountToken(account)
        res.cookie("jwt", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60 * 1000,
        })
        res.locals.accountData = account
      } catch (err) {
        console.error("Password update token issuance failed:", err)
        req.flash(
          "notice",
          "Password updated, but authentication token could not be refreshed. Please log in again."
        )
        res.clearCookie("jwt")
        return res.redirect("/account/login")
      }
    }

    req.flash("notice", "Password updated successfully.")
    return res.redirect("/account")
  } catch (error) {
    console.error("Password update failed:", error)
    req.flash("notice", "Password could not be updated.")
    const account = await accountModel.getAccountById(account_id)
    return res.status(500).render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      passwordErrors: null,
      account: account || { account_id },
    })
  }
}

/* ********************************
 * Logout and clear JWT cookie
 * ******************************** */
async function logoutAccount(req, res) {
  res.clearCookie("jwt")
  res.locals.loggedin = false
  res.locals.accountData = null
  req.flash("notice", "You have been logged out.")
  return res.redirect("/")
}

module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  accountLogin,
  buildAccountManagement,
  buildUpdateAccount,
  updateAccount,
  updatePassword,
  logoutAccount,
}
