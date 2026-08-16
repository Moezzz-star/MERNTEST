import app from "./app.js";

import {
  connectDatabase,
} from "./config/database.js";

import {
  env,
} from "./config/env.js";


async function startServer() {
  try {
    await connectDatabase();

    app.listen(
      env.PORT,
      "0.0.0.0",
      () => {
        console.log(
          `🚀 Server running on port ${env.PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "❌ Failed to start server:",
      error
    );

    process.exit(1);
  }
}


startServer();