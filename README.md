# JS.Blend v1

This an ongoing experimental update of js.blend using a new process to pull information from Blender Files

The core parse code will largely remain unchanged. Some minor revisions may be made as I refactor
that code and try to optimize it for a better on-demand data extraction experience. 

## Mappers

I have an idea for a mapper system the will allow extensions to be easily made. 

The core of the idea is to create an interface that accept mapper objects which
specify what information should be pulled out of the file and also determine how
that data should be transformed into JS objects. 

Here's an example of how such an interface would be used

```typescript

// Loads file and parses the DNA. Does not do any additional work at this point
const model_blend = await JSBLEND("./blender_file_path/model.blend");

// createThreeJSLightMapper returns an iterable class that has the necessary
// code needed to extract light information from 
const light_mapper = JSBLEND.mappers.createThreeJSLightMapper("omnidirectional");

const model_mapper = JSBLEND.mappers.createTheeJS("my_legit_model");

// JSBLEND now will parse the actual data of the file,
// passing struct data to the mappers as they are 
// encountered.
blender_file.extract(light_mapper, model_mapper);

//ThreeJS objects are now available for use
const 
	lights = [...light_mapper],
	model= [...model_mapper];
```

Mappers could be composed of other mappers, allowing complex structure to be extracted
and combined into the desired output.

## Additional Feature Ideas

Write a script that extracts DNA information and outputs a 
human readable file to review the types of structs available
for a givin Blender file version. 
