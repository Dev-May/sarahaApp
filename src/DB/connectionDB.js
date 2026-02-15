import mongoose from "mongoose";
import chalk from "chalk"

const checkConnectionDB = async () => {
  await mongoose
    .connect(process.env.DB_URL_ONLINE)
    .then(() => {
      console.log(chalk.yellow(`success to connect db ${process.env.DB_URL_ONLINE} 💙✌️`));
    })
    .catch((error) => {
      console.log(`fail to connect db ${process.env.DB_URL_ONLINE} 😡👀`, error);
    });
};

export default checkConnectionDB;
