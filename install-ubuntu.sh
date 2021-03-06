#!/bin/bash

sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8080

cd

sudo add-apt-repository -y ppa:chris-lea/node.js
sudo apt-get update 
sudo apt-get -y install git-core
sudo apt-get install python-software-properties python g++ make
sudo apt-get install nodejs
sudo apt-get -y install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++

git clone https://github.com/stephanfowler/ophan-sparklines.git

cd ophan-sparklines

npm install
sudo npm install forever -g

forever start app.js
