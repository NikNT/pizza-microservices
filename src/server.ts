import { Config } from "./config";
import app from "./app";
import logger from "./config/logger";
import { AppDataSource } from "./config/data-source";
const startServer = async () => {
  const PORT = Config.PORT;
  try {
    await AppDataSource.initialize();
    logger.info("Database connected successfully");

    app.listen(PORT, () => {
      logger.info("Server listening on port", { port: PORT });
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error(err.message);
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  }
};

void startServer();
