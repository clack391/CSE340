/* ********************************
 * Account Routes
 * unit 4 deliver login activity
 * ******************************** */


const express = require("express")
const router = new express.Router()
const accountController = require("../controllers/accountController")
const utilities = require("../utilities")
const regValidate = require("../utilities/account-validation")

/* ********************************
 * Deliver login view
 * unit 4 deliver login activity
 * ******************************** */

router.get(
  "/login",
  utilities.handleErrors(accountController.buildLogin)
)

router.get(
  "/register",
  utilities.handleErrors(accountController.buildRegister)
)

router.get(
  "/",
  utilities.requireAccountLogin,
  utilities.handleErrors(accountController.buildAccountManagement)
)

/* ********************************
 * Process registration
 * ******************************** */

router.post(
  "/register",
  regValidate.registationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
)

/* ********************************
 * Process the login attempt
 * ******************************** */

router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
)

/* ********************************
 * Deliver account update view
 * ******************************** */
router.get(
  "/update/:accountId",
  utilities.requireAccountLogin,
  utilities.handleErrors(accountController.buildUpdateAccount)
)

/* ********************************
 * Process account update data
 * ******************************** */
router.post(
  "/update",
  utilities.requireAccountLogin,
  regValidate.updateAccountRules(),
  regValidate.checkUpdateData,
  utilities.handleErrors(accountController.updateAccount)
)

/* ********************************
 * Process password change
 * ******************************** */
router.post(
  "/update-password",
  utilities.requireAccountLogin,
  regValidate.passwordRules(),
  regValidate.checkPasswordData,
  utilities.handleErrors(accountController.updatePassword)
)

router.get(
  "/logout",
  utilities.requireAccountLogin,
  utilities.handleErrors(accountController.logoutAccount)
)

module.exports = router
