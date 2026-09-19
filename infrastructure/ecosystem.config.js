module.exports = {
    apps: [
        {
            name: "voltrix-platform",
            script: "node_modules/next/dist/bin/next",
            args: "start",
            cwd: "./",
            instances: "max", // Enable PM2 dynamic clustering for maximum performance
            exec_mode: "cluster",
            autorestart: true, // Auto-restart on crash
            watch: false,
            max_memory_restart: "1G", // Restart process automatically if memory leaks past 1GB
            env: {
                PORT: 3000,
                NODE_ENV: "production"
            },
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            error_file: "./logs/pm2-error.log",
            out_file: "./logs/pm2-out.log",
            combine_logs: true,
            merge_logs: true
        }
    ]
};
