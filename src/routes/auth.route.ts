import express from "express";
import { register, login, refresh } from "../controllers/auth.controller.ts";
import * as rate from "../middleware/rateLimit.middleware.ts";

let router = express.Router();

let authRoute = (app: any) => {
  router.post("/register", rate.auth, register);
  router.post("/login", rate.auth, login);
  router.post("/refresh", rate.auth, refresh);
  return app.use("/auth", rate.auth, router);
};

export default authRoute;
