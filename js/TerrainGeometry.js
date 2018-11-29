/**
 * @author insominx - Michael Guerrero
 */

THREE.TerrainGeometry = function ( config ) {

    this.width = 2048;
    this.length = 2048;
    this.heightScale = 200.0;
    this.widthSegs = 1000;
    this.lengthSegs = 1000;

    this.bufferGeom = null;
};

THREE.TerrainGeometry.prototype = {

    constructor: THREE.TerrainGeometry,

    createGeometry: function(finishedCallback) {

        this.bufferGeom = new THREE.PlaneBufferGeometry(this.width, this.length, this.widthSegs, this.lengthSegs);
        this.bufferGeom.rotateX( - Math.PI / 2 );

        function bind( scope, fn ) {
            return function () {
                fn.apply( scope, arguments );
                if (finishedCallback != null) {
                    finishedCallback();
                }
            };
        };

        this.terrainHeight = new THREE.TextureLoader().load("textures/terrain/height-test.png", bind(this, this.onTerrainHeightmapLoaded));
    },

    onTerrainHeightmapLoaded: function() {

        this.heightData = this.getHeightImageData().data;

        var mapWidth = this.terrainHeight.image.width;
        var mapHeight = this.terrainHeight.image.height;

        var widthVerts = this.widthSegs + 1;
        var lengthVerts = this.lengthSegs + 1;

        for (var i = 0; i < lengthVerts; ++i) {

            var percentHeight = i / (lengthVerts - 1);

            for (var j = 0; j < widthVerts; ++j) {

                var percentWidth = j / (widthVerts - 1);

                var row = Math.round(percentHeight * (mapHeight - 1));
                var column = Math.round(percentWidth * (mapWidth - 1));

                var rowPixel = row * mapWidth * 4;
                var columnPixel = column * 4;

                var index = rowPixel + columnPixel;

                var vertIndex = (i * widthVerts + j) * 3;

                this.bufferGeom.attributes.position.array[vertIndex + 1] = 
                    this.heightData[index] * this.heightScale / 255.0;
            }
        }

        this.bufferGeom.computeVertexNormals();
        this.bufferGeom.computeBoundingSphere();
    },

    getHeightImageData: function () {

        var canvas = document.createElement('canvas');

        //var canvas = document.getElementById('mycanvas');
        var mapWidth = this.terrainHeight.image.width;
        var mapHeight = this.terrainHeight.image.height;

        canvas.width = mapWidth;
        canvas.height = mapHeight;

        var context = canvas.getContext("2d");
        context.drawImage(this.terrainHeight.image, 0, 0);

        return context.getImageData(0, 0, mapWidth, mapHeight);
    },

    getTerrainHeight: function (x, y) {

        var halfWidth = this.width / 2;
        var halfLength = this.length / 2;

        var percentWidth = (x + halfWidth) / this.width;
        var percentLength = (y + halfLength) / this.length;

        var mapWidth = this.terrainHeight.image.width;
        var mapHeight = this.terrainHeight.image.height;

        var preciseRow = percentLength * (mapHeight - 1);
        var preciseCol = percentWidth * (mapWidth - 1);

        var row = Math.round(preciseRow);
        var col = Math.round(preciseCol);

        var rowPixel = row * mapWidth * 4;
        var columnPixel = col * 4;

        var index = rowPixel + columnPixel;

        var dx = preciseRow - row;
        var dy = preciseCol - col;

        // bilinear filter the result
        var q11 = this.heightData[index];
        var q12 = this.heightData[index + 4];
        var q21 = this.heightData[index + mapWidth * 4];
        var q22 = this.heightData[index + (mapWidth + 1) * 4];

        var result =  q11 * (1.0 - dx) * (1.0 - dy) +
                      q21 * dx * (1.0 - dy) +
                      q12 * (1.0 - dx) * dy +
                      q22 * dx * dy;

        return result * this.heightScale / 255.0;
    },

    getTerrainHeightSmoothed: function (x, y) {

        var halfWidth = this.width / 2;
        var halfLength = this.length / 2;

        var percentWidth = (x + halfWidth) / this.width;
        var percentLength = (y + halfLength) / this.length;

        var mapWidth = this.terrainHeight.image.width;
        var mapHeight = this.terrainHeight.image.height;

        var row = Math.round(percentLength * (mapHeight - 1));
        var column = Math.round(percentWidth * (mapWidth - 1));

        var rowPixel = row * mapWidth * 4;
        var columnPixel = column * 4;

        var index = rowPixel + columnPixel;

        var gaussKernel = [0.00296901674395065, 0.013306209891014005, 0.02193823127971504, 0.013306209891014005, 0.00296901674395065,
                           0.013306209891014005, 0.05963429543618023, 0.09832033134884507, 0.05963429543618023, 0.013306209891014005,
                           0.02193823127971504, 0.09832033134884507, 0.16210282163712417, 0.09832033134884507, 0.02193823127971504,
                           0.013306209891014005, 0.05963429543618023, 0.09832033134884507, 0.05963429543618023, 0.013306209891014005,
                           0.00296901674395065, 0.013306209891014005, 0.02193823127971504, 0.013306209891014005, 0.00296901674395065];

        var average = 0.0;

        for (var i = 0; i < 5; ++i) {

            var rowPixel = (row + i - 2) * mapWidth * 4;

            for (var j = 0; j < 5; ++j) {
                average += this.heightData[rowPixel + (column - 2 + j) * 4] * gaussKernel[i * 5 + j];
            }
        }

        return average * this.heightScale / 255.0;
    }
}
