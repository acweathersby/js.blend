# JS.BLEND - *.blend the native way


Tired of having to export your Blender projects with the mirad of export formats that adds a layer of seperation and complexity between your favorite 3D application and the browser? Want a direct, seamless path between creation of 3D models in Blender and interacting with them in Webgl apps like Three.js?  


JS.BLEND is a simple script that can parse Blender files (.blend) and create an output that is easily navigatable in Javascript. The script reads raw binary blend files and converts them into javascript objects. With this there is no need to write or use exporters in Blender to get mesh data out and into applications like Three.js. JS.BLEND parses the entire Blender file and creates data objects for meshes, lights, cameras, and any other data structure that is stored in the Blender file. Now, raw Blender files can be directly imported into projects and parsed, allowing access to the entire Blender project and cutting out the additional step of exporting from Blender.  


The HTML file contains a basic example where .blend files can be drag-and-dropped from the local file system into the browser window. The files are parsed with JS.BLEND and any mesh data that is in the .blend file gets converted into a Threes.js geometry object and then added to the scene and displayed.

Try it out live here: http://cinder1.github.io/js.blend/

# USAGE

JS.BLEND can be used by creating a new parsing object by calling jsblend().

```js
 var blendparser = jsblend(); 
 
```
 Assign a function to jsblend.onParseReady to gain access to an array of data objects once JS.BLEND has finished reading the file and converting it into Javascript objects. 

```js
  blendparser.onParseReady = function(parsed_blend_file) {
      console.log(parsed_blend_file);
  }
  
```

 Pass a raw binary Blender file in the form of a BLOB or an ArrayBuffer to start parsing. 

```js
//Use .loadBlendFromArrayBuffer for ArrayBuffer
blendparser.loadBlendFromArrayBuffer(ab);

//Use .loadBlendFromBlob for BLOB
blendparser.loadBlendFromBlob(blob);

```

Check out the code in the example to see how this comes together to extract and display meshes from .blend files.
