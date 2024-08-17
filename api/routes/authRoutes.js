const Router = require("express").Router;
const requests = require("../controllers/authController");

const router = Router();

router.post("/signup", requests.signup);
router.post("/login", requests.login);
router.post("/verify-otp", requests.verifyOtp);
router.get("/otp", requests.getOtp);
router.get("/getdata", requests.getData);

module.exports = router;
