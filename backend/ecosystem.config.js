export default {
  apps: [
    {
      name: "semasearch",
      script: "src/index.js",
      cwd: "/var/www/semasearch-backend/backend", // Absolute path to your app
      instances: 2, // Use multiple CPU cores (adjust based on your server)
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      max_memory_restart: "500M",
      restart_delay: 4000,
    },
  ],
};
