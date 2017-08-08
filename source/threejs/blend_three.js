/*jshint esversion: 6 */

const createMaterial = require("./material.js");
const createTexture = require("./texture.js");
const createMesh = require("./mesh.js");
const createLight = require("./light.js");

function loadModel(three_scene, model_name, blender_file, cache) {
	var mats = blender_mesh.mat,
		materials = [];
	for (var i = 0; i < mats.length; i++) {
		var material = createThreeJSMaterial(mats[i]);
		materials.push(material);
	}
}

var blender_types = {
	mesh_object: 1,
	lamp: 10
};

function loadScene(three_scene, blender_file, cache) {
	//build object from blender mesh object
	for (let i = 0; i < blender_file.objects.Object.length; i++) {

		let obj = blender_file.objects.Object[i];

		//Load Lights

		if (obj.type == blender_types.lamp) {

			let light = createLight(obj, blender_file);

			three_scene.add(light);
		}

		//Load Meshes

		if (obj.type == blender_types.mesh_object) {
			if (obj.data) {
				//get the mesh 
				var buffered_geometry = createMesh(obj.data, [0, 0, 0]);
					
				var blend_material = obj.data.mat[0];
				
				if(blend_material){
					var material = createMaterial(blend_material);
				}else{
					//create generic material
				}

				//var geometry = createThreeJSGeometry(obj.data, [0, 0, 0]);
				///*
				//create a transform from the mesh object
				var mesh = new THREE.Mesh(buffered_geometry, material);

				mesh.castShadow = true;
				mesh.receiveShadow = true;

				three_scene.add(mesh);

				mesh.rotateZ(obj.rot[2]);
				mesh.rotateY(obj.rot[1]);
				mesh.rotateX(obj.rot[0]);
				mesh.scale.fromArray(obj.size, 0);
				mesh.position.fromArray([obj.loc[0], (obj.loc[2]), (-obj.loc[1])], 0);
				//*/
			}
		}
	}
}

module.exports = (blender_file) => {

	if (!THREE) {
		console.warn("No ThreeJS object detected");
		return {};
	}

	var cache = {};

	return {
		loadScene: (three_scene) => loadScene(three_scene, blender_file, cache),
		loadModel: (model_name) => loadModel(model_name, blender_file, cache)
	};
};