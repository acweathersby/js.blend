
/*jshint esversion: 6 */

const three = require("./threejs/blend_three.js");

const parser = require("./parser/parser.js")();


function loadFile(blender_file, res, rej){	
	
	three_module = three(blender_file);

	//TODO: Report any errors with ThreeJS before continuing.
	
	res({
		file : blender_file,
		three : three_module
	});
}

/* This represents a parsed blendfile instance if parsing is successful. It will accept a string or a binary data object. Strings must be a valid URI to a blender file. Binary data may be in the form of an ArrayBuffer, TypedArray, or a Blob. Binary data must also contain the binary data of a blender file.*/

JSBLEND = (fileuri_or_filedata, name = "")=>{

	const promise = new Promise(
		(res, rej) =>{
			parser.onParseReady = (blender_file, error) => {
				if(error){
					rej(error);
				}else{
					loadFile(blender_file, res, rej);
				}
			};

			//If fileuri_or_filedata is a string, attempt to load the file asynchronously
			if(typeof fileuri_or_filedata == "string"){
				
				let request = new XMLHttpRequest();
			    
			    request.open("GET", fileuri_or_filedata, true);
			    
			    request.responseType = 'blob';
			    
			    request.onload = () => {
			        let file = request.response;
			        
			        parser.loadBlendFromBlob(new Blob([file]), fileuri_or_filedata);
			    };
			    
			    request.send();

			    return;
			}

			if(typeof fileuri_or_filedata == "object"){
				//Attempt to load from blob or array buffer;
				if(fileuri_or_filedata instanceof ArrayBuffer){
					parser.loadBlendFromArrayBuffer(fileuri_or_filedata, name);
					return;
				}

				if(fileuri_or_filedata instanceof Blob){
					parser.loadBlendFromBlob(fileuri_or_filedata, name);
					return;
				}
			}

			//Unknown file type passed -> abort and reject
			
			rej("Unsupported file type passed to JSBlend ${fileuri_or_filedata}");
		}
	);

	return promise;
};