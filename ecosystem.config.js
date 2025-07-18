module.exports = {
  apps: [
    {
      name: "md2doc",
      script: "dist/index.js",
      watch: false,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        PORT: 3000
      },
      error_file: "./logs/md2doc-error.log",
      out_file: "./logs/md2doc-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true
    }
  ]
};
