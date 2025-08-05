import checkConnectionDB from "./DB/connectionDB.js";
import { globalErrorHandling } from "./middleware/globalErrorHandling.js";
import userRouter from "./modules/users/user.controller.js";

const bootstrap = async (app, express) => {
  app.use(express.json());

  app.get("/", (req, res) =>
    res.status(200).json({ message: "Welcome on my app...... ❤️" })
  );

  checkConnectionDB();

  app.use("/users", userRouter);

  app.use("{/*demo}", (req, res, next) => {
    throw new Error(`Url Not Found ${req.originalUrl}`, { cause: 404 });
  });

  app.use(globalErrorHandling);
};

export default bootstrap;
