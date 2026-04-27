import { Router, type IRouter } from "express";
import healthRouter from "./health";
import operationRouter from "./operation";
import userRouter from "./user";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(operationRouter);
router.use(authRouter);
router.use(userRouter);

export default router;
