# JS.BLEND
## The Blender file parser for JavaScript

JS.BLEND is a file parser that is designed to read unmodified Blender files and convert the binary data into JavaScript objects which can be used in JavaScript applications. It's designed with an easy to use interface to allow for quick integration with 3D apps, namely by using the ThreeJS library. It also allows for manual access to Blender `C` class and data structures that are converted into JavaScript objects.

## Demo

[Example](https://acweathersby.github.io/js.blend/)

## Usage

JS.BLEND can be installed through NPM. Once downloaded, the production file can be found in the /build folder as js.blend.js. The source files will need built using Browserify or any other Common.js module bundler.

```html
<script src="./build/js.blend.js"></script>
```

Using the script is easy. You can either pass to 'JSBLEND' a raw `ArrayBuffer` or `Blob` containing the binary of the 
Blender file, or you can supply a URI to the Blender file resource. 

```javascript
	JSBLEND(array_buffer).then((blend)=>{...})

	JSBLEND(blob).then((blend)=>{...})
	
	JSBLEND("./blends/test.blend").then((blend)=>{...})
```

A `promise` will be returned that will provide a reference to a parsed blender file object in the response, or a string with an error message if the file could not be parsed.

```javascript
	JSBLEND("./blends/test.jpg").then((blend)=>{}).catch((error)=>{
		console.log(error) //->  "Not a Blender file"
	}); 
```
### ThreeJS

To use the parsed results with ThreeJS a `three` member is available in the response object. This member contains two function: `loadScene` and `loadObject`.

`*.three.loadScene([ThreeJSScene])` will load Lights, Mesh Objects, and Materials into a ThreeJS `scene` object that is passed to the function.

```javascript
	var scene = new THREE.Scene();

	blend.three.loadScene(scene);
```

`*.three.loadObject([string])` accepts a string with the name of a Blender object and will attempt to extract and return an equivilant ThreeJS object.

```javascript
	var light = blend.three.loadObject("Lamp"); //-> ThreeJS light returned;

	var cube = blend.three.loadObject("Cube"); //-> ThreeJS Mesh Object with materials returned;
```

#### Notes on using with Blender

Please see the following document for more information on using JS.BLEND with ThreeJS: [notes](./threejs_notes.md)

### Raw Data

JS.BLEND works by turning the schemas, also known in Blender as SDNAs, in the .blend file into JavaScript prototype objects. It then creates new objects from these prototypes, one for every single data structure stored in the file. The actual data is left stored in an `ArrayBuffer` and `TypedArray` views and `DataViews` used to make the stuctured data available to the rest of JS. 

The compiled objects can be found by accessing `blend.file.objects`, which is used as a key/value lookup for all data structures from the file.  For example `blend.file.objects["Mesh"]` will return an array of all mesh objects stored in the file. 

Official documentation for Blender data structures is hard to come by, and there have been several changes to the data structures since version 1.0 of Blender. This means that accessing and using the raw data is a bit of a discovery process, and requires utilizing the Debugger to investigate the object prototypes to see what members they contain. 

#### Potential

Since the entire .blend file is made available through this script, every single resource that can be created in Blender and saved to file can be accessed and used in JavaScript. This means that, ultimataly, information such as animation data, bone hiearchies, and particle system setups can be saved in Blender and then immediatly extracted and used in Javascript and integrated into projects.

## License

This program is free to use and distribute under the MIT. 
