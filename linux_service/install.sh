#/bin/bash
sudo chmod +x ../app.js
sudo cp gestib2google.service /etc/systemd/system/
sudo systemctl enable gestib2google.service
