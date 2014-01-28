cd

sudo apt-get update 
sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++

git clone git@github.com:stephanfowler/ophan-sparklines.git

cd ophan-sparklines

npm install

npm install forever -g
forever start app.js
