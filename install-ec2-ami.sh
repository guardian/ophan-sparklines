cd

sudo yum erase cairo

export PKG_CONFIG_PATH='/usr/local/lib/pkgconfig'  
export LD_LIBRARY_PATH='/usr/local/lib':$LD_LIBRARY_PATH  

curl http://optimate.dl.sourceforge.net/project/libpng/libpng15/1.5.17/libpng-1.5.17.tar.gz -o libpng.tar.gz  
tar -zxf libpng.tar.gz && cd libpng-1.5.17/
./configure --prefix=/usr/local   
make 
sudo make install  
cd

curl http://www.ijg.org/files/jpegsrc.v8d.tar.gz -o jpegsrc.tar.gz
tar -zxf jpegsrc.tar.gz && cd jpeg-8d/
./configure --disable-dependency-tracking --prefix=/usr/local  
make
sudo make install
cd

curl http://www.cairographics.org/releases/pixman-0.28.2.tar.gz -o pixman.tar.gz  
tar -zxf pixman.tar.gz && cd pixman-0.28.2/  
./configure --prefix=/usr/local   
make 
sudo make install  
cd

curl http://download.savannah.gnu.org/releases/freetype/freetype-2.4.11.tar.gz -o freetype.tar.gz  
tar -zxf freetype.tar.gz && cd freetype-2.4.11/  
./configure --prefix=/usr/local   
make 
sudo make install 
cd

curl http://cairographics.org/releases/cairo-1.12.14.tar.xz -o cairo.tar.xz  
tar -xJf cairo.tar.xz && cd cairo-1.12.14/  
./configure --disable-dependency-tracking --without-x --prefix=/usr/local 
make 
sudo make install 
cd

npm install forever -g

git clone git@github.com:stephanfowler/ophan-sparklines.git

cd ophan-sparklines

npm install

forever start app.js
