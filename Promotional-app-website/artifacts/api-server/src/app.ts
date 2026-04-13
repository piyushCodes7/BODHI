import express, {
  type Express,
  type Request,
  type Response,
  type RequestHandler,
} from "express";
import cors from "cors";
import pinoHttpImport from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const pinoHttp = pinoHttpImport as unknown as (
  options: Record<string, unknown>,
) => RequestHandler;

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: Request & { id?: string | number }) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: Response) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
