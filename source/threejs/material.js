/*jshint esversion: 6 */

module.exports = (() => {
    const createTexture = require("./texture.js");

    var texture_mappings = {
        diff_color: 1,
        normal: 2,
        mirror: 8,
        diff_intensity: 16,
        spec_intensity: 32,
        emit: 32,
        alpha: 128,
        spec_hardness: 256,
        ray_mirror: 512,
        translucency: 1024,
        ambient: 2048,
        displacement: 4096,
        warp: 8192
    };

    let blender_specular_types = {
        cooktorr: 0,
        phong: 1,
        blinn: 2,
        toon: 3,
        wardiso: 4
    };

    function applyColorMapping(blender_texture, three_texture, material) {
        if (blender_texture.mapto & texture_mappings.diff_color) {
            material.map = three_texture;
        }
    }

    function applySpecMapping(blender_texture, three_texture, material) {
        if (blender_texture.mapto & texture_mappings.spec_color && material.type != "MeshStandardMaterial") {
            material.specularMap = three_texture;
        }

        if (blender_texture.mapto & texture_mappings.spec_intensity && material.type != "MeshStandardMaterial") {
            material.roughnessMap = three_texture;
        }
    }

    function applyAlphaMapping(blender_texture, three_texture, material) {
        if (blender_texture.mapto & texture_mappings.alpha) {
            material.alphaMap = three_texture;
        }
    }

    function applyNormalMapping(blender_texture, three_texture, material) {
        if (blender_texture.mapto & texture_mappings.normal) {
            material.normalMap = three_texture;
            material.normalScale = {
                x: blender_texture.norfac,
                y: blender_texture.norfac
            };
        }
    }

    function applyMirrorMapping(blender_texture, three_texture, material) {
        if (blender_texture.mapto & texture_mappings.mirror) {
            material.envMap = three_texture;
            material.envMapIntensity = blender_texture.mirrfac;
        }
    }

    var blender_texture_coordinates = {
        GENERATED : 1,
        REFLECTION : 2,
        NORMAL:4,
        GLOBAL : 8,
        UV : 16,
        OBJECT : 32,
        WINDOW: 1024,
        TANGENT:4096,
        PARTICLE: 8192,
        STRESS:16384
    }

    var blender_texture_mapping = {
        FLAT : 0,
        CUBE : 1,
        TUBE : 2,
        SPHERE : 3
    }

    function applyTexture(blender_texture, material) {
        //extract blender_texture data. Use Only if image has been supplied.
        if (blender_texture && blender_texture.tex && blender_texture.tex.ima) {

            let three_texture = createTexture(blender_texture.tex.ima);

            if(blender_texture.texco == blender_texture_coordinates.REFLECTION){
                switch(blender_texture.mapping){
                    case blender_texture_mapping.FLAT:
                        three_texture.mapping = THREE.EquirectangularReflectionMapping;
                    break;
                    case blender_texture_mapping.SPHERE:
                        three_texture.mapping = THREE.SphericalReflectionMapping;
                    break;
                }
                 //three_texture.mapping = THREE.EquirectangularRefractionMapping;
            }
            
            applyColorMapping(blender_texture, three_texture, material);
            
            applySpecMapping(blender_texture, three_texture, material);
            
            applyAlphaMapping(blender_texture, three_texture, material);
            
            applyNormalMapping(blender_texture, three_texture, material);

            applyMirrorMapping(blender_texture, three_texture, material);
        }
    }

    return function createThreeJSMaterial(blend_mat) {

        var material = null;

        var textures = blend_mat.mtex;

        switch (blend_mat.spec_shader) {
            case blender_specular_types.lambert:
                material = new THREE.MeshLambertMaterial();
                material.color.setRGB(blend_mat.r, blend_mat.g, blend_mat.b);
                break;
            case blender_specular_types.blinn:
            case blender_specular_types.phong:

                material = new THREE.MeshStandardMaterial();
                material.color.setRGB(blend_mat.r, blend_mat.g, blend_mat.b);
                //material.specular.setRGB(blend_mat.specr, blend_mat.specg, blend_mat.specb);
                material.roughness = (1 - (blend_mat.har / 512));
                material.metalness = 1 - blend_mat.ref;
                if(blend_mat.alpha < 0.98){
                    material.transparent = true;
                    material.opacity = blend_mat.alpha;
                    console.log(blend_mat, material)
                }
                break;
            case blender_specular_types.wardiso:
            case blender_specular_types.cooktorr:
                material = new THREE.MeshPhongMaterial();
                material.color.setRGB(blend_mat.r, blend_mat.g, blend_mat.b);
                material.specular.setRGB(blend_mat.specr, blend_mat.specg, blend_mat.specb);
                material.shininess = blend_mat.har / 512;
                material.reflectivity = blend_mat.ref * 100;
                break;
            default:
                material = new THREE.MeshLambertMaterial();
                material.color.setRGB(blend_mat.r, blend_mat.g, blend_mat.b);
                break;
        }

        var at = (texture) => applyTexture(texture, material);


        if (textures && textures.length) textures.map(at);

        return material;
    };
})();