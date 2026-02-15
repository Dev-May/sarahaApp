import checkConnectionDB from "./DB/connectionDB.js";
import { globalErrorHandling } from "./middleware/globalErrorHandling.js";
import messageRouter from "./modules/messages/message.controller.js";
import userRouter from "./modules/users/user.controller.js";
import cors from "cors";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";

const bootstrap = async (app, express) => {
  const whitelist = [process.env.FRONTEND_ORIGIN, undefined];
  const corsOptions = {
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  };

  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 requests per windowMs
    // message: {
    //   error: "Too many requests from this IP, please try again later."
    // },
    // statusCode: 400
    handler: (req, res, next) => {
       res.status(400).json({
        error: "Game Over",
      });
    },
    // legacyHeaders: false,
    skipSuccessfulRequests: true,
  })

  app.use(cors(corsOptions));
  app.use(morgan("combined"));
  app.use(limiter);
  app.use(helmet()) // Set security-related HTTP headers

  app.use(express.json());

  app.get("/", (req, res) =>
    res.status(200).json({ message: "Welcome on my app...... ❤️" }),
  );

  checkConnectionDB();
  app.use("/uploads", express.static("uploads"));
  app.use("/users", userRouter);
  app.use("/messages", messageRouter);

  app.use("{/*demo}", (req, res, next) => {
    throw new Error(`Url Not Found ${req.originalUrl}`, { cause: 404 });
  });

  app.use(globalErrorHandling);
};

export default bootstrap;
