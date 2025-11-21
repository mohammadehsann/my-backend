const express = require("express");
const User = require("../Model/user");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/auth");
const isAuth = require("../middlware/is-auth");
router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("please enter valid email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject("Email Already Exists");
          }
        });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 6 }),
    body("name").trim().not().isEmpty(),
  ],
  authController.signup
);
router.post("/login", authController.login);

router.get("/status", isAuth, authController.getStatus);
router.patch(
  "/status",
  [body("status").trim().not().isEmpty()],
  isAuth,
  authController.updateStatus
);

module.exports = router;
