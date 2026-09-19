# Voltrix Platform - Server, Infrastructure & Disaster Recovery Manual

This manual outlines the production hosting guidelines, security configurations, network firewalls, time synchronization, server update routines, and recovery operations.

---

## 1. Network & Firewall Configuration

To shield the Next.js server against unauthorized ports, only HTTP (80), HTTPS (443), and SSH (22) must be exposed outer-network.

### Linux / Ubuntu (UFW)
Configure the Uncomplicated Firewall to block everything except core web ports:
```bash
# 1. Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 2. Allow standard services
sudo ufw allow 22/tcp comment 'Secure SSH access'
sudo ufw allow 80/tcp comment 'HTTP redirect'
sudo ufw allow 443/tcp comment 'HTTPS production secure'

# 3. Enable firewall
sudo ufw --force enable
sudo ufw status verbose
```

### Windows Host (Netsh)
If hosted on a Windows node/server, run PowerShell as Administrator to constrain inbound traffic:
```powershell
# Disable generic unused ports and only authorize standard ports
New-NetFirewallRule -DisplayName "Voltrix HTTP Inbound" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80
New-NetFirewallRule -DisplayName "Voltrix HTTPS Inbound" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 443
New-NetFirewallRule -DisplayName "Voltrix RDP / SSH Admin Access" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3389, 22
```

---

## 2. Reverse Proxy & SSL (Nginx / Apache)

Ensure Nginx handles raw client requests, processes SSL terminations, and proxies requests down to the cluster instance at `localhost:3000`.

*   **Configuration File**: Placed in `/etc/nginx/sites-available/voltrixpower.com` (rendered at `infrastructure/nginx.conf`).
*   **Enabling Site**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/voltrixpower.com /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    ```

### SSL Generation via Certbot (Let's Encrypt)
To obtain SSL certificates for production:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d voltrixpower.com -d www.voltrixpower.com
```

### Automatic Certificate Renewal
Ensure renewal is set as a daily cron check. Standard systemd cron handles this automatically, but manually verify:
```bash
# Test renewal behavior dry-run
sudo certbot renew --dry-run
```
Add the custom renewal script `renew-certs.sh` to trigger Nginx reload upon successful certificate fetches.

---

## 3. Server Updates & Security

Keep OS kernel and utilities updated automatically to avoid known vulnerabilities.

### Linux Automatic Security Updates
Install and configure the `unattended-upgrades` system:
```bash
sudo apt install unattended-upgrades update-notifier-common -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```
Configure `/etc/apt/apt.conf.d/50unattended-upgrades` to enable auto-updates of standard packages:
```apt
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}:${distro_codename}-updates";
};
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:00";
```

---

## 4. Time Synchronization

Consistent logging database stamps, security token checks, and APIs require system time synchronicity.

### Linux (systemd-timesyncd)
```bash
# Enable NTP daemon
sudo timedatectl set-ntp true
# Verify status
timedatectl status
```
If using NTP explicitly, ensure pool servers are set in `/etc/systemd/timesyncd.conf`:
```ini
[Time]
NTP=0.pool.ntp.org 1.pool.ntp.org
FallbackNTP=ntp.ubuntu.com
```

---

## 5. Process Lifecycle & Auto-Restart

The Next.js node application must reload automatically if memory leaks occur or if the hosting container restarts.

*   **Docker Container Layer**: Setup with `restart: unless-stopped` dynamically in `docker-compose.yml`.
*   **Systemd Service Configuration**: If running raw node without containers:
    Create `/etc/systemd/system/voltrix.service`:
    ```ini
    [Unit]
    Description=Voltrix Power Systems Web Worker
    After=network.target

    [Service]
    Type=simple
    User=nextjs
    WorkingDirectory=/var/www/voltrix-power-systems
    ExecStart=/usr/bin/npm run start
    Restart=always
    RestartSec=5
    Environment=NODE_ENV=production PORT=3000
    StandardOutput=journal
    StandardError=journal

    [Install]
    WantedBy=multi-user.target
    ```
    Enable and start service:
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable voltrix.service
    sudo systemctl start voltrix.service
    ```

---

## 6. Backup Strategy

*   **Hourly Backup Check**: Database logs and inquiries states are synchronized securely.
*   **Daily Compressed Snapshots**: Generated via `infrastructure/backup.sh`, including database dump and environment configuration.
*   **Storage Policies**: Transferred daily to an offsite secure storage bucket (AWS S3 / Google Cloud Storage) with a 14-day retention cycle.

---

## 7. Disaster Recovery Runbook (Step-by-Step Restoration)

In the event of database corruption or hardware crash:

1.  **Deploy Clean Host Server**: Spin up a replacement target VM or container instance.
2.  **Clone Source & Set dependencies**:
    ```bash
    git clone https://github.com/voltrix/voltrix-power-systems.git /var/www/voltrix-power-systems
    cd /var/www/voltrix-power-systems
    npm ci
    ```
3.  **Restore Secret Environment Variables**:
    Retrieve the backed-up `.env` file from secure offsite vault storage and place it in the application root directory.
4.  **Fetch Latest Backup Snapshot**:
    Download the targeted `.tar.gz` from the offsite storage bucket.
5.  **Restore MongoDB Database**:
    ```bash
    # Extract snapshot
    tar -xzf voltrix_backup_YYYYMMDD_HHMMSS.tar.gz -C /tmp/
    
    # Restore collection state
    mongorestore --uri="$MONGOURI" /tmp/voltrix_backup_YYYYMMDD_HHMMSS/mongodb/
    ```
6.  **Restart Web Service Workers**:
    Restart the container setup or PM2/Systemd target:
    ```bash
    # If Docker Compose
    docker-compose -f infrastructure/docker-compose.yml up -d --build
    
    # If PM2 setup
    pm2 reload ecosystem.config.js
    ```
7.  **Run Health Checks**:
    Perform a HTTP query to `/api/health` to confirm active database synchronization.

---

## 8. Application Rollback Strategy

If a deployment introduces a critical regression, use the following procedures to roll back:

### Git-based Rollback (Standard PM2/Systemd Deployments)
1. **Locate Last Stable Commit**: Log recent actions from repository history:
   ```bash
   git log --oneline -n 10
   ```
2. **Hard Reset current workspace** to target stable commit version:
   ```bash
   git reset --hard <STABLE_COMMIT_HASH>
   ```
3. **Re-install dependencies & Rebuild Web Assets**:
   ```bash
   npm ci
   npm run build
   ```
4. **Reload PM2 / Systemd Processes**:
   ```bash
   pm2 reload ecosystem.config.js
   # Or if utilizing systemd
   sudo systemctl restart voltrix.service
   ```

### Docker Container Rollback
1. **Pull Previous Release Image** from container registry:
   ```bash
   docker pull voltrix/voltrix-platform:v<PREVIOUS_VERSION_TAG>
   ```
2. **Update Build Tag Target** inside Compose config file.
3. **Restart Docker Containers**:
   ```bash
   docker-compose -f infrastructure/docker-compose.yml up -d
   ```
4. **Clean up Orphaned Containers**:
   ```bash
   docker container prune -f
   ```
