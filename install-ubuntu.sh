#!/bin/bash

cd

sudo apt-get update 
sudo apt-get -y install git-core
sudo apt-get -y install nodejs npm
sudo apt-get -y install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++

git clone https://github.com/stephanfowler/ophan-sparklines.git

cd ophan-sparklines

npm install --registry http://registry.npmjs.org/
sudo npm install forever -g --registry http://registry.npmjs.org/

forever start app.js
