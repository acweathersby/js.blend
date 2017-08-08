/*jshint esversion: 6 */

let blender_texture_cache = {};


module.exports = function createThreeJSTexture(image) {
    let base64 = require("base64-js");
    let parsed_blend_file = image.__blender_file__;
    let texture = null;
    let name = image.aname;

    if (image.packedfile) {

        if (blender_texture_cache[name]) {
            texture = blender_texture_cache[name];
        } else {

            //get the extension
            let ext = name.split('.').pop();

            let data = image.packedfile;

            let size = data.size;

            let offset = data.data.__data_address__;

            let raw_data = parsed_blend_file.byte.slice(offset, offset + size);

            let encodedData = base64.fromByteArray(raw_data);

            let dataURI;

            switch (ext) {
                case "png":
                    dataURI = "data:image/png;base64," + encodedData;
                    break;
                case "jpg":
                    dataURI = "data:image/jpeg;base64," + encodedData;
                    break;
            }

            let img = new Image();

            img.src = dataURI;

            texture = new THREE.Texture(img);

            img.onload = () => {
                texture.needsUpdate = true;
            };

            blender_texture_cache[name] = texture;
        }
    }
    return texture;
};