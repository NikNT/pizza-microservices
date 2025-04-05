import { Config } from "./config";
import app from "./app";
import logger from "./config/logger";
const startServer = () => {
  const PORT = Config.PORT;
  try {
    app.listen(PORT, () => {
      logger.info("Server listening on port", { port: PORT });
    });
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
};

startServer();
