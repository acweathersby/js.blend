/*jshint esversion: 6 */

const createMaterial = require("./material.js");
const createTexture = require("./texture.js");
const createMesh = require("./mesh.js");
const createLight = require("./light.js");

const blender_object_types = {
	mesh: 1,
	lamp: 10
};

function createObject(blender_file, object) {
	
	if (object.data) {
		//get the mesh 
		var buffered_geometry = createMesh(object.data, [0, 0, 0]);

		var blend_material = object.data.mat[0];

		if (blend_material) {
			var material = createMaterial(blend_material);
		}

		var mesh = new THREE.Mesh(buffered_geometry, material);

		mesh.castShadow = true;
		mesh.receiveShadow = true;

		mesh.rotateZ(object.rot[2]);
		mesh.rotateY(object.rot[1]);
		mesh.rotateX(object.rot[0]);
		mesh.scale.fromArray(object.size, 0);
		mesh.position.fromArray([object.loc[0], (object.loc[2]), (-object.loc[1])], 0);

		return mesh;
	}

	return null;
}

function loadObject(object_name, blender_file, cache) {
	var objects = blender_file.Object;
	materials = [];

	for (var i = 0; i < objects.length; i++) {
		let object = objects[i];

		if (object.aname === object_name) {
			switch (object.type) {
				case blender_object_types.mesh:
					return createObject(object, blender_file);
					break;
				case blender_object_types.lamp:
					return createLight(object, blender_file);
					break;
			}
		}
	}

	return null;
}

function loadScene(three_scene, blender_file, cache) {

	for (let i = 0; i < blender_file.objects.Object.length; i++) {

		let object = blender_file.objects.Object[i];

		//Load Lights
		if (object.type == blender_object_types.lamp) {
			let light = createLight(blender_file, object);
			three_scene.add(light);
		}

		//Load Meshes
		if (object.type == blender_object_types.mesh) {
			let mesh = createObject(blender_file, object);
			if(mesh){
				three_scene.add(mesh);
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
		loadObject: (object_name) => loadObject(object_name, blender_file, cache)
	};
};