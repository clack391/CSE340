// Needed Resources 
const express = require("express")
const router = new express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities")
const invValidate = require("../utilities/inventory-validation")

const requireInventoryAccess = [
  utilities.requireAccountLogin,
  utilities.requireEmployeeAccount,
]

// Management view
router.get(
  "/",
  ...requireInventoryAccess,
  utilities.handleErrors(invController.buildManagementView)
)

// Add classification view
router.get(
  "/add-classification",
  ...requireInventoryAccess,
  utilities.handleErrors(invController.buildAddClassification)
)

// Process classification
router.post(
  "/add-classification",
  ...requireInventoryAccess,
  invValidate.classificationRules(),
  invValidate.checkClassificationData,
  utilities.handleErrors(invController.createClassification)
)

// Add inventory view
router.get(
  "/add-inventory",
  ...requireInventoryAccess,
  utilities.handleErrors(invController.buildAddInventory)
)

// Process inventory
router.post(
  "/add-inventory",
  ...requireInventoryAccess,
  invValidate.inventoryRules(),
  invValidate.checkInventoryData,
  utilities.handleErrors(invController.createInventory)
)

// Inventory by classification
router.get(
  "/type/:classificationId",
  utilities.handleErrors(invController.buildByClassificationId)
)

// Vehicle detail by id
router.get(
  "/detail/:invId",
  utilities.handleErrors(invController.buildByInvId)
)

module.exports = router
