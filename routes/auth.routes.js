import express from "express";
import {login , signup , refresh , logout} from "../controllers/auth.controller.js";
import {authenticate} from "../middlewares/auth.middlware.js";

var router = express.Router();

router.post("/login" , login);
router.post("/signup" , signup);
router.post("/refresh" , refresh);
router.post("/logout" , authenticate , logout);

export default router;