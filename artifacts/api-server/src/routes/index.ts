import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import patientsRouter from "./patients";
import leadsRouter from "./leads";
import serviceCatalogRouter from "./service-catalog";
import quotesRouter from "./quotes";
import documentsRouter from "./documents";
import intakeRouter from "./intake";
import biomarkersRouter from "./biomarkers";
import consentRouter from "./consent";
import gdprRouter from "./gdpr";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(patientsRouter);
router.use(leadsRouter);
router.use(serviceCatalogRouter);
router.use(quotesRouter);
router.use(documentsRouter);
router.use(intakeRouter);
router.use(biomarkersRouter);
router.use(consentRouter);
router.use(gdprRouter);

export default router;
