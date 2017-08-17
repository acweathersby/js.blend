/*jshint esversion: 6 */

var blender_light_types = {
	point: 0,
	sun: 1,
	spot: 0,
	hemi: 0,
	area: 0
};

module.exports = function createThreeJSLamp(blend_lamp) {

	let ldata = blend_lamp.data;

	let pos_array = [blend_lamp.loc[0], blend_lamp.loc[2], -blend_lamp.loc[1]];

	let color = ((ldata.r * 255) << 16) | ((ldata.g * 255) << 8) | ((ldata.b * 255) << 0);
	let intesity = ldata.energy;
	let distance = 0;

	var three_light = null;

	switch (ldata.type) {
		case blender_light_types.point:
			var three_light = new THREE.PointLight(color, intesity, distance);
			three_light.position.fromArray(pos_array, 0);
			three_light.castShadow = true;
			break;
		case blender_light_types.sun:
			var three_light = new THREE.PointLight(color, intesity, distance);
			three_light.position.fromArray(pos_array, 0);
			three_light.castShadow = true;
			three_light.shadow.mapSize.width = 1024;
			three_light.shadow.mapSize.height = 1024;
			three_light.shadow.camera.near = 0.01;
			three_light.shadow.camera.far = 500;
			break;
	}

	return three_light;
}