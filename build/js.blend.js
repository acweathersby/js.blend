(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return (b64.length * 3 / 4) - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr((len * 3 / 4) - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0; i < l; i += 4) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],2:[function(require,module,exports){

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
			parser.onParseReady = (blender_file) => {
				loadFile(blender_file, res, rej);
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
			debugger

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

			console.warn("Unsupported file type passed to JSBlend", fileuri_or_filedata);
			
			rej("Unsupported file type passed to JSBlend");
		}
	);

	return promise;
};
},{"./parser/parser.js":3,"./threejs/blend_three.js":4}],3:[function(require,module,exports){
/*jshint esversion: 6 */

const DNA1 = 826363460;
const ENDB = 1111772741;

/* Note: Blender cooridinates treat the Z axis as the verticle and  Y as depth. */
module.exports  = (function(unzipper) {
    //A helper object to identify Blender Object structs by type name. 
    var blender_types = {
        mesh_object: 1,
        lamp: 10,
    };

    //web worker not functional in this version
    USE_WEBWORKER = false;

    var worker = null,

        FR = new FileReader(),

        return_object = {
            loadBlendFromArrayBuffer: function(array_buffer) {
                return_object.ready = false;
                if (USE_WEBWORKER) {
                    worker.postMessage(array_buffer, array_buffer);
                } else {
                    worker.onmessage({
                        data: array_buffer
                    });
                }
            },
            loadBlendFromBlob: function(blob) {
                FR.onload = function() {
                    return_object.loadBlendFromArrayBuffer(this.result);
                };
                FR.readAsArrayBuffer(blob);
            },
            ready: true,
            onParseReady: function() {},
        };

    worker = new worker_code();

    worker.postMessage = function(message) {
        return_object.onParseReady(message);
    };

    function worker_code() {
        "use strict";

        var data = null,
            _data = null,
            BIG_ENDIAN = false,
            pointer_size = 0,
            struct_names = [],
            offset = 0,
            working_blend_file = null,
            current_SDNA_template = null,
            templates = {},
            finished_objects = [],
            FILE = null,
            AB = null;

        function parseFile(msg) {
            var self = this;
            if (typeof msg.data == "object") {
                // reset global variables
                AB = null;
                data = null;
                BIG_ENDIAN = false;
                pointer_size = 0;
                struct_names = [];
                offset = 0;
                working_blend_file = null;
                finished_objects = [];
                current_SDNA_template = null;


                // set data
                _data = msg.data;

                AB = _data.slice();

                data = new DataView(_data);


                FILE = new BLENDER_FILE(AB);

                //start parsing
                readFile();

                //export parsed data
                self.postMessage(FILE);
            }
        }

        /*
            Export object for a parsed __blender_file__.
        */

        var BLENDER_FILE = function(AB) {
            this.AB = AB;
            //this.double = new Float64Array(AB);
            this.byte = new Uint8Array(AB);

            this.dv = new DataView(AB);

            this.objects = {};
            this.memory_lookup = {},
                this.object_array = [];

            this.template = null;
        };

        BLENDER_FILE.prototype = {
            addObject: function(obj) {
                this.object_array.push(obj);
                if (!this.objects[obj.blender_name]) this.objects[obj.blender_name] = [];
                this.objects[obj.blender_name].push(obj);
            },
            primeTypes: function(list_of_dna_names) {
                for (var i = 0; i < list_of_dna_names.length; i++) {
                    //this.objects[list_of_dna_names[i]] = [];
                }
            },
            getPointer: function(offset) {
                var pointerLow = this.dv.getUint32(offset, this.template.endianess);
                if (this.template.pointer_size > 4) {
                    var pointerHigh = this.dv.getUint32(offset + 4, this.template.endianess);
                    if (this.template.endianess) {
                        return (pointerLow) + "l|h" + pointerHigh;
                    } else {
                        return (pointerHigh) + "h|l" + pointerLow;
                    }
                } else {
                    return pointerLow;
                }
            }
        };

        function getDocument(data) {
            var obj = readFile(null, data);
        }

        self.onmessage = parseFile;
        this.onmessage = parseFile;

        /*
            These functions map offsets in the blender __blender_file__ to basic types (byte,short,int,float) through TypedArrays;
            This allows the underlying binary data to be changed.
        */

        function float64Prop(offset, Blender_Array_Length, length) {
            return {
                get: function() {
                    return (Blender_Array_Length > 1) ?
                        new Float64Array(this.__blender_file__.AB, this.__data_address__ + offset, length) :
                        this.__blender_file__.dv.getFloat64(this.__data_address__ + offset, this.__blender_file__.template.endianess);
                },
                set: function(float) {
                    if (Blender_Array_Length > 1) {} else {
                        this.__blender_file__.dv.setFloat64(this.__data_address__ + offset, float, this.__blender_file__.template.endianess);
                    }
                },
            };
        }

        function floatProp(offset, Blender_Array_Length, length) {
            return {
                get: function() {
                    return (Blender_Array_Length > 1) ?
                        new Float32Array(this.__blender_file__.AB, this.__data_address__ + offset, length) :
                        this.__blender_file__.dv.getFloat32(this.__data_address__ + offset, this.__blender_file__.template.endianess);
                },
                set: function(float) {
                    if (Blender_Array_Length > 1) {} else {
                        this.__blender_file__.dv.setFloat32(this.__data_address__ + offset, float, this.__blender_file__.template.endianess);
                    }
                },
            };
        }

        function intProp(offset, Blender_Array_Length, length) {
            return {
                get: function() {
                    return (Blender_Array_Length > 1) ?
                        new Int32Array(this.__blender_file__.AB, this.__data_address__ + offset, length) :
                        this.__blender_file__.dv.getInt32(this.__data_address__ + offset, this.__blender_file__.template.endianess);
                },
                set: function(int) {
                    if (Blender_Array_Length > 1) {} else {
                        this.__blender_file__.dv.setInt32(this.__data_address__ + offset, float, this.__blender_file__.template.endianess);
                    }
                },
            };
        }

        function uIntProp(offset, Blender_Array_Length, length) {
            return {
                get: function() {
                    return (Blender_Array_Length > 1) ?
                        new Uint32Array(this.__blender_file__.AB, this.__data_address__ + offset, length) :
                        this.__blender_file__.dv.getUint32(this.__data_address__ + offset, this.__blender_file__.template.endianess);
                },
                set: function(int) {
                    if (Blender_Array_Length > 1) {} else {
                        this.__blender_file__.dv.setUint32(this.__data_address__ + offset, float, this.__blender_file__.template.endianess);
                    }
                },
            };
        }

        function shortProp(offset, Blender_Array_Length, length) {
            return {
                get: function() {
                    return (Blender_Array_Length > 1) ?
                        new Int16Array(this.__blender_file__.AB, this.__data_address__ + offset, length) :
                        this.__blender_file__.dv.getInt16(this.__data_address__ + offset, this.__blender_file__.template.endianess);
                },
                set: function(float) {
                    if (Blender_Array_Length > 1) {} else {
                        this.__blender_file__.dv.setInt16(this.__data_address__ + offset, float, this.__blender_file__.template.endianess);
                    }
                },
            };
        }

        var uShortProp = (offset, Blender_Array_Length, length) => {
            return {
                get: function() {
                    return (Blender_Array_Length > 1) ?
                        new Uint16Array(this.__blender_file__.AB, this.__data_address__ + offset, length) :
                        this.__blender_file__.dv.getUint16(this.__data_address__ + offset, this.__blender_file__.template.endianess);
                },
                set: function(float) {
                    if (Blender_Array_Length > 1) {} else {
                        this.__blender_file__.dv.setUint16(this.__data_address__ + offset, float, this.__blender_file__.template.endianess);
                    }
                },
            };
        }


        function charProp(offset, Blender_Array_Length, length) {
            return {
                get: function() {
                    if (Blender_Array_Length > 1) {
                        let start = this.__data_address__ + offset;
                        let end = start;
                        let buffer_guard = 0;

                        while (this.__blender_file__.byte[end] != 0 && buffer_guard++ < length) end++;

                        return toString(this.__blender_file__.AB, start, end)
                    }
                    return this.__blender_file__.byte[(this.__data_address__ + offset)];
                },
                set: function(byte) {
                    if (Blender_Array_Length > 1) {
                        var string = byte + "",
                            i = 0,
                            l = string.length;
                        while (i < length) {
                            if (i < l) {
                                this.__blender_file__.byte[(this.__data_address__ + offset + i)] = string.charCodeAt(i) | 0;
                            } else {
                                this.__blender_file__.byte[(this.__data_address__ + offset + i)] = 0;
                            }
                            i++;
                        }
                    } else {
                        this.__blender_file__.byte[(this.__data_address__ + offset)] = byte | 0;
                    }
                }
            };
        }

        function pointerProp2(offset) {
            return {
                get: function() {
                    let pointer = this.__blender_file__.getPointer(this.__data_address__ + offset, this.__blender_file__);
                    var link = this.__blender_file__.memory_lookup[pointer];

                    var results = [];

                    if (link) {
                        var address = link.__data_address__;
                        let j = 0;
                        while (true) {
                            pointer = this.__blender_file__.getPointer(address + j * 8, this.__blender_file__);
                            let obj = this.__blender_file__.memory_lookup[pointer];
                            if (!obj) break;
                            results.push(obj);
                            j++
                        }

                    };

                    return results;
                },
                set: function() {}
            }
        }

        function pointerProp(offset, Blender_Array_Length, length) {
            return {
                get: function() {
                    if (Blender_Array_Length > 1) {
                        let array = [];
                        let j = 0;
                        let off = offset;
                        while (j < Blender_Array_Length) {
                            let pointer = this.__blender_file__.getPointer(this.__data_address__ + off, this.__blender_file__);

                            array.push(this.__blender_file__.memory_lookup[pointer]);
                            off += length ///this.__blender_file__.template.pointer_size;
                            j++;
                        }

                        return array;
                    } else {
                        let pointer = this.__blender_file__.getPointer(this.__data_address__ + offset, this.__blender_file__);
                        return this.__blender_file__.memory_lookup[pointer];
                    }
                },
                set: function() {}
            }
        }

        function compileProp(obj, name, type, offset, array_size, IS_POINTER, pointer_size, length) {

            if (!IS_POINTER) {
                switch (type) {
                    case "double":
                        Object.defineProperty(obj, name, float64Prop(offset, array_size, length >> 3));
                        break;
                    case "float":
                        Object.defineProperty(obj, name, floatProp(offset, array_size, length >> 2));
                        break;
                    case "int":
                        Object.defineProperty(obj, name, intProp(offset, array_size, length >> 2));
                        break;
                    case "short":
                    case "ushort":
                        Object.defineProperty(obj, name, shortProp(offset, array_size, length >> 1));
                        break;
                    case "char":
                    case "uchar":
                        Object.defineProperty(obj, name, charProp(offset, array_size, length));
                        break;
                    default:
                        //compile list to 
                        obj[name] = {};
                        obj.__list__.push(name, type, length, offset, array_size, IS_POINTER);
                }
                obj._length += length;
                offset += length;
            } else {
                Object.defineProperty(obj, name, pointerProp(offset, array_size, pointer_size));
                offset += pointer_size * array_size;
            }

            return offset;
        }

        //Store final DNA structs
        var MASTER_SDNA_SCHEMA = function(version) {
            this.version = version;
            this.SDNA_SET = false;
            this.byte_size = 0;
            this.struct_index = 0;
            this.structs = {};
            this.SDNA = {};
            this.endianess = false;
        };

        MASTER_SDNA_SCHEMA.prototype = {
            getSDNAStructureConstructor: function(name, struct) {
                if (struct) {
                    var blen_struct = Function("function " + name + "(){}; return " + name)();

                    blen_struct.prototype = new BLENDER_STRUCTURE();
                    blen_struct.prototype.blender_name = name;
                    blen_struct.prototype.__pointers = [];
                    blen_struct.prototype.__list__ = [];

                    var offset = 0;
                    //Create properties of struct
                    for (var i = 0; i < struct.length; i += 3) {
                        var _name = struct[i],
                            n = _name,
                            type = struct[i + 1],
                            length = struct[i + 2],
                            array_length = 0,
                            match = null,
                            Blender_Array_Length = 1,
                            Suparray_match = 1,
                            PointerToArray = false,
                            Pointer_Match = 0;
                        var DNA = this.SDNA[name] = {
                            constructor: blen_struct
                        };


                        let original_name = _name;

                        //mini type parser
                        if ((match = _name.match(/(\*?)(\*?)(\w+)(\[(\w*)\])?(\[(\w*)\])?/))) {

                            //base name
                            _name = match[3];

                            //pointer type
                            if (match[1]) {
                                Pointer_Match = 10;
                                blen_struct.prototype.__pointers.push(_name);
                            }

                            if (match[2]) {
                                PointerToArray = true;
                            }

                            //arrays
                            if (match[4]) {
                                if (match[6]) {
                                    Suparray_match = parseInt(match[5]);
                                    Blender_Array_Length = parseInt(match[7]);
                                } else {
                                    Blender_Array_Length = parseInt(match[5]);
                                }
                            }
                            array_length = Blender_Array_Length * length;
                            length = array_length * Suparray_match;
                        }

                        DNA[n] = {
                            type: type,
                            length: length,
                            isArray: (Blender_Array_Length > 0),
                        };

                        if (PointerToArray) {
                            Object.defineProperty(blen_struct.prototype, _name, pointerProp2(offset));
                            offset += pointer_size;
                        } else if (Suparray_match > 1) {
                            var array_names = new Array(Suparray_match);

                            //construct sub_array object that will return the correct structs
                            for (var j = 0; j < Suparray_match; j++) {
                                let array_name_ = `__${_name}[${j}]__`;
                                array_names[j] = array_name_;

                                offset = compileProp(blen_struct.prototype, array_name_, type, offset, Blender_Array_Length, Pointer_Match, pointer_size, array_length);
                            }

                            Object.defineProperty(blen_struct.prototype, _name, {
                                get: (function(array_names) {
                                    return function() {
                                        var array = [];
                                        for (var i = 0; i < array_names.length; i++) {
                                            array.push(this[array_names[i]])
                                        }
                                        return array;
                                    }
                                })(array_names)
                            });
                        } else {
                            offset = compileProp(blen_struct.prototype, _name, type, offset, Blender_Array_Length, Pointer_Match, pointer_size, length);
                        }
                    }

                    return this.SDNA[name].constructor;

                } else {
                    if (!this.SDNA[name]) {
                        return null;
                    }
                    return this.SDNA[name].constructor;
                }
            }
        };

        var BLENDER_STRUCTURE = function() {
            this.__blender_file__ = null;
            this.__list__ = null;
            this.__super_array_list__ = null;
            this.blender_name = "";
            this.__pointers = null;
            this.address = null;
            this.length = 0;
            this.__data_address__ = 0;
            this.blender_name = "";
            this._length = 0;
        };


        /*
            Returns a pre-constructed BLENDER_STRUCTURE or creates a new BLENDER_STRUCTURE to match the DNA struct type
        */
        var pointer_function = (pointer) => () => {
            return FILE.memory_lookup[pointer]
        };

        function getPointer(offset) {
            var pointerLow = data.getUint32(offset, BIG_ENDIAN);
            if (pointer_size > 4) {
                var pointerHigh = data.getUint32(offset + 4, BIG_ENDIAN);

                if (BIG_ENDIAN) {
                    return (pointerLow) + "" + pointerHigh;
                } else {
                    return (pointerHigh) + "" + pointerLow;
                }
            } else {
                return pointerLow;
            }
        }

        BLENDER_STRUCTURE.prototype = {
            setData: function(pointer, _data_offset, data_block_length, BLENDER_FILE) {
                if (this.__list__ == null) return this;
                BLENDER_FILE.addObject(this);

                this.__blender_file__ = BLENDER_FILE;

                var struct = this.__list__,
                    j = 0,
                    i = 0,
                    obj, name = "",
                    type, length, Blender_Array_Length, Pointer_Match, offset, constructor;

                this.__data_address__ = _data_offset;

                if (struct === null) return this;

                for (i = 0; i < struct.length; i += 6) {
                    obj = null;
                    name = struct[i];
                    type = struct[i + 1];
                    Blender_Array_Length = struct[i + 4];
                    Pointer_Match = struct[i + 5];
                    offset = this.__data_address__ + struct[i + 3];

                    if (Blender_Array_Length > 1) {
                        this[name] = [];
                        j = 0;
                        while (j < Blender_Array_Length) {
                            if (current_SDNA_template.getSDNAStructureConstructor(type)) {
                                constructor = current_SDNA_template.getSDNAStructureConstructor(type);
                                this[name].push((new constructor()).setData(0, offset, offset + length / Blender_Array_Length, BLENDER_FILE));
                            } else this[name].push(null);
                            offset += length / Blender_Array_Length;
                            j++;
                        }
                    } else {
                        if (current_SDNA_template.getSDNAStructureConstructor(type)) {
                            constructor = current_SDNA_template.getSDNAStructureConstructor(type);
                            this[name] = (new constructor()).setData(0, offset, length + offset, BLENDER_FILE);
                        } else this[name] = null;
                    }
                }
                //break connection to configuration list
                this.__list__ = null;
                return this;
            },

            get aname() {
                if (this.id) return this.id.name.slice(2);
                else return undefined;
            }
        };

        function toString(buffer, _in, _out) {
            return String.fromCharCode.apply(String, new Uint8Array(buffer, _in, _out - _in));
        }

        //Begin parsing blender __blender_file__
        function readFile() {
            var count = 0;
            var offset2 = 0;
            var root = 0;
            var i = 0;
            var data_offset = 0;
            var sdna_index = 0;
            var code = "";
            var block_length = 0;
            var curr_count = 0;
            var curr_count2 = 0;

            FILE.memory_lookup = {};
            struct_names = [];
            offset = 0;

            // Make sure we have a .blend __blender_file__. All blend files have the first 12bytes
            // set with BLENDER-v### in Utf-8
            if (toString(_data, offset, 7) !== "BLENDER") return console.warn("File supplied is not a .blend compatible Blender file.");

            // otherwise get templete from save version.

            offset += 7;
            pointer_size = ((toString(_data, offset++, offset)) == "_") ? 4 : 8;
            BIG_ENDIAN = toString(_data, offset++, offset) !== "V";
            var version = toString(_data, offset, offset + 3);


            //create new master template if none exist for current blender version;
            if (!templates[version]) {
                templates[version] = new MASTER_SDNA_SCHEMA(version);
            }

            current_SDNA_template = templates[version];

            FILE.template = current_SDNA_template;

            offset += 3;

            //Set SDNA structs if template hasn't been set.
            //Todo: Move the following block into the MASTER_SDNA_SCHEMA object.
            //*Like so:*/ current_SDNA_template.set(AB);

            if (!current_SDNA_template.SDNA_SET) {
                current_SDNA_template.endianess = BIG_ENDIAN;
                current_SDNA_template.pointer_size = pointer_size;
                //find DNA1 data block
                offset2 = offset;

                while (true) {
                    sdna_index = data.getInt32(offset2 + pointer_size + 8, BIG_ENDIAN);
                    code = toString(_data, offset2, offset2 + 4).replace(/\u0000/g, "");
                    block_length = data.getInt32(offset2 + 4, true);
                    offset2 += 16 + (pointer_size);
                    if (code === "DNA1") {
                        // DNA found; This is the core of the __blender_file__ and contains all the structure for the various data types used in Blender.
                        count = 0;
                        var types = [],
                            fields = [],
                            names = [],
                            lengths = [],
                            name = "",
                            curr_name = "";

                        //skip SDNA and NAME identifiers
                        offset2 += 8;

                        //Number of structs.
                        count = data.getInt32(offset2, true);
                        offset2 += 4;

                        curr_count = 0;

                        //Build up list of names for structs
                        while (curr_count < count) {
                            curr_name = "";
                            while (data.getInt8(offset2) !== 0) {
                                curr_name += toString(_data, offset2, offset2 + 1);
                                offset2++;
                            }
                            names.push(curr_name);
                            offset2++;
                            curr_count++;
                        }


                        //Adjust for 4byte alignment
                        if ((offset2 % 4) > 0) offset2 = (4 - (offset2 % 4)) + offset2;
                        offset2 += 4;

                        //Number of struct types
                        count = data.getInt32(offset2, true);
                        offset2 += 4;
                        curr_count = 0;

                        //Build up list of types
                        while (curr_count < count) {
                            curr_name = "";
                            while (data.getInt8(offset2) !== 0) {
                                curr_name += toString(_data, offset2, offset2 + 1);
                                offset2++;
                            }
                            types.push(curr_name);
                            offset2++;
                            curr_count++;
                        }

                        //Adjust for 4byte alignment
                        if ((offset2 % 4) > 0) offset2 = (4 - (offset2 % 4)) + offset2;
                        offset2 += 4;
                        curr_count = 0;

                        //Build up list of byte lengths for types
                        while (curr_count < count) {
                            lengths.push(data.getInt16(offset2, BIG_ENDIAN));
                            offset2 += 2;
                            curr_count++;
                        }

                        //Adjust for 4byte alignment
                        if ((offset2 % 4) > 0) offset2 = (4 - (offset2 % 4)) + offset2;
                        offset2 += 4;

                        //Number of structures
                        var structure_count = data.getInt32(offset2, BIG_ENDIAN);
                        offset2 += 4;
                        curr_count = 0;

                        //Create constructor objects from list of SDNA structs
                        while (curr_count < structure_count) {
                            var struct_name = types[data.getInt16(offset2, BIG_ENDIAN)];
                            offset2 += 2;
                            obj = [];
                            count = data.getInt16(offset2, BIG_ENDIAN);
                            offset2 += 2;
                            curr_count2 = 0;
                            struct_names.push(struct_name);

                            //Fill an array with name, type, and length for each SDNA struct property
                            while (curr_count2 < count) {
                                obj.push(names[data.getInt16(offset2 + 2, BIG_ENDIAN)], types[data.getInt16(offset2, BIG_ENDIAN)], lengths[data.getInt16(offset2, BIG_ENDIAN)]);
                                offset2 += 4;
                                curr_count2++;
                            }

                            //Create a SDNA constructor by passing [type,name,lenth] array as second argument
                            current_SDNA_template.getSDNAStructureConstructor(struct_name, obj);
                            curr_count++;
                        }
                        current_SDNA_template.SDNA_SET = true;
                        current_SDNA_template.SDNA_NAMES = struct_names;
                        break;
                    }
                    offset2 += block_length;
                }
            }

            //parse the rest of the data, starting back at the top.
            //TODO: turn into "on-demand" parsing.

            while (true) {
                if ((offset % 4) > 0) {
                    offset = (4 - (offset % 4)) + offset;
                }

                data_offset = offset;
                sdna_index = data.getInt32(offset + pointer_size + 8, BIG_ENDIAN);
                let code_uint = data.getUint32(offset, BIG_ENDIAN);
                offset2 = offset + 16 + (pointer_size);
                offset += data.getInt32(offset + 4, true) + 16 + (pointer_size);

                if (code_uint === DNA1); //skip - already processed at this point    
                else if (code_uint === ENDB) break; //end of __blender_file__ found
                else {
                    //Create a Blender object using a constructor template from current_SDNA_template
                    var data_start = data_offset + pointer_size + 16;

                    //Get a SDNA constructor by name;
                    var constructor = current_SDNA_template.getSDNAStructureConstructor(current_SDNA_template.SDNA_NAMES[sdna_index]);

                    var size = data.getInt32(data_offset + 4, BIG_ENDIAN);

                    count = data.getInt32(data_offset + 12 + pointer_size, BIG_ENDIAN);

                    if (count > 0) {
                        var obj = new constructor();

                        var length = constructor.prototype._length;


                        var address = FILE.getPointer(data_offset + 8);

                        obj.address = address + "";

                        obj.setData(address, data_start, data_start + size, FILE);

                        if (count > 1) {
                            let array = [];
                            array.push(obj);
                            for (var u = 1; u < count; u++) {
                                obj = new constructor();
                                obj.setData(address, data_start + length * u, data_start + (length * u) + length, FILE);
                                array.push(obj);
                            }
                            FILE.memory_lookup[address] = array;
                        } else {
                            FILE.memory_lookup[address] = obj;
                        }
                    }
                }
            }
        }
    }
    return return_object;
});
},{}],4:[function(require,module,exports){
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
},{"./light.js":5,"./material.js":6,"./mesh.js":7,"./texture.js":8}],5:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
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
},{"./texture.js":8}],7:[function(require,module,exports){
/*jshint esversion: 6 */
module.exports = function createThreeJSBufferGeometry(blender_mesh, origin) {
    //get materials
    let pick_material = 0,
        mesh = blender_mesh,
        faces = mesh.mpoly,
        loops = mesh.mloop,
        UV = mesh.mloopuv,
        verts = mesh.mvert;

    var geometry = new THREE.BufferGeometry();

    if (!faces) return geometry;

    var index_count = 0;

    //precalculate the size of the array needed for faces
    var face_indice_count = 0;
    var face_indice_counta = 0;

    for (var i = 0; i < faces.length; i++) {
        var face = faces[i] || faces;
        var len = face.totloop;
        var indexi = 1;

        face_indice_counta += (len * 2 / 3) | 0;

        while (indexi < len) {
            face_indice_count += 3;
            indexi += 2;
        }
    }

    //extract face info and dump into array buffer;
    var face_buffer = new Uint32Array(face_indice_count);
    var uv_buffer = new Float32Array(face_indice_count * 2);
    var normal_buffer = new Float32Array(face_indice_count * 3);
    var verts_array_buff = new Float32Array(face_indice_count * 3);

    for (var i = 0; i < faces.length; i++) {
        var face = faces[i] || faces;
        var len = face.totloop;
        var start = face.loopstart;
        var indexi = 1;
        var offset = 0;

        while (indexi < len) {
            var face_normals = [];
            var face_index_array = [];
            var face_uvs = [];

            let index = 0;

            for (var l = 0; l < 3; l++) {
                //Per Vertice 

                if ((indexi - 1) + l < len) {
                    index = start + (indexi - 1) + l;
                } else {
                    index = start;
                }

                var v = loops[index].v;
                var vert = verts[v];
                face_buffer[index_count] = index_count;
                //get normals, which are 16byte ints, and norm them back into floats.

                verts_array_buff[index_count * 3 + 0] = vert.co[0] + origin[0];
                verts_array_buff[index_count * 3 + 1] = vert.co[2] + origin[2];
                verts_array_buff[index_count * 3 + 2] = -vert.co[1] + -origin[1];

                normal_buffer[index_count * 3 + 0] = vert.no[0];
                normal_buffer[index_count * 3 + 1] = vert.no[2];
                normal_buffer[index_count * 3 + 2] = (-vert.no[1]);


                if (UV) {
                    var uv = UV[index].uv;
                    uv_buffer[index_count * 2 + 0] = uv[0];
                    uv_buffer[index_count * 2 + 1] = uv[1];
                }

                index_count++;
            }

            indexi += 2;
        }
    }

    geometry.addAttribute('position', new THREE.BufferAttribute(verts_array_buff, 3));
    geometry.setIndex(new THREE.BufferAttribute(face_buffer, 1));
    geometry.addAttribute('normal', new THREE.BufferAttribute(normal_buffer, 3));
    geometry.addAttribute('uv', new THREE.BufferAttribute(uv_buffer, 2));
    //geometry.blend_mat = materials[pick_material];

    return geometry;
};

function createThreeJSGeometry(blender_mesh, origin) {
    //get materials
    var mats = blender_mesh.mat,
        materials = [];
    for (var i = 0; i < mats.length; i++) {
        var material = createThreeJSMaterial(mats[i]);
        materials.push(material);
    }

    let pick_material = 0,
        mesh = blender_mesh,
        faces = mesh.mpoly,
        loops = mesh.mloop,
        UV = mesh.mloopuv,
        verts = mesh.mvert,
        vert_array = [],
        face_array = [],
        uv_array = [],
        normal_array = [];

    var geometry = new THREE.Geometry();

    if (!faces) return geometry;


    var index_count = 0;

    let verts_array_buff = new Float32Array(verts.length * 3);

    for (var i = 0; i < verts.length; i++) {
        let vert = verts[i];
        vert_array.push(new THREE.Vector3(vert.co[0] + origin[0], vert.co[2] + origin[2], -vert.co[1] - origin[1]));
    }

    for (var i = 0; i < faces.length; i++) {
        var face = faces[i] || faces;
        var len = face.totloop;
        var start = face.loopstart;
        var indexi = 1;

        pick_material = face.mat_nr;

        while (indexi < len) {
            var face_normals = [];
            var face_index_array = [];
            var face_uvs = [];

            let index = 0;

            for (var l = 0; l < 3; l++) {
                //Per Vertice 

                if ((indexi - 1) + l < len) {
                    index = start + (indexi - 1) + l;
                } else {
                    index = start;
                }

                var v = loops[index].v;
                var vert = verts[v];

                face_index_array.push(v);

                index_count++;

                //get normals, which are 16byte ints, and norm them back into floats.

                var
                    n1 = vert.no[0],
                    n2 = vert.no[2],
                    n3 = -vert.no[1];

                var nl = 1;

                Math.sqrt((n1 * n1) + (n2 * n2) + (n3 * n3));

                face_normals.push(new THREE.Vector3(n1 / nl, n2 / nl, n3 / nl));

                if (UV) {
                    var uv = UV[index].uv;
                    face_uvs.push(new THREE.Vector2(uv[0], uv[1]));
                }
            }
            uv_array.push(face_uvs);
            face_array.push(new THREE.Face3(
                face_index_array[0], face_index_array[1], face_index_array[2],
                face_normals
            ));

            indexi += 2;
        }
    }
    geometry.blend_mat = materials[pick_material];
    geometry.vertices = vert_array;
    geometry.faces = face_array;
    if (uv_array.length > 0) {
        geometry.faceVertexUvs = [uv_array];
    }

    geometry.uvsNeedUpdate = true;

    //Well, using blender file normals does not work. Will need to investigate why normals from the blender file do not provide correct results. 
    //For now, have Three calculate normals. 

    geometry.computeVertexNormals();


    return geometry;
};
},{}],8:[function(require,module,exports){
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
},{"base64-js":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9iYXNlNjQtanMvaW5kZXguanMiLCJzb3VyY2UvbWFpbi5qcyIsInNvdXJjZS9wYXJzZXIvcGFyc2VyLmpzIiwic291cmNlL3RocmVlanMvYmxlbmRfdGhyZWUuanMiLCJzb3VyY2UvdGhyZWVqcy9saWdodC5qcyIsInNvdXJjZS90aHJlZWpzL21hdGVyaWFsLmpzIiwic291cmNlL3RocmVlanMvbWVzaC5qcyIsInNvdXJjZS90aHJlZWpzL3RleHR1cmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2eEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnRzLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5leHBvcnRzLnRvQnl0ZUFycmF5ID0gdG9CeXRlQXJyYXlcbmV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IGZyb21CeXRlQXJyYXlcblxudmFyIGxvb2t1cCA9IFtdXG52YXIgcmV2TG9va3VwID0gW11cbnZhciBBcnIgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgPyBVaW50OEFycmF5IDogQXJyYXlcblxudmFyIGNvZGUgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLydcbmZvciAodmFyIGkgPSAwLCBsZW4gPSBjb2RlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gIGxvb2t1cFtpXSA9IGNvZGVbaV1cbiAgcmV2TG9va3VwW2NvZGUuY2hhckNvZGVBdChpKV0gPSBpXG59XG5cbnJldkxvb2t1cFsnLScuY2hhckNvZGVBdCgwKV0gPSA2MlxucmV2TG9va3VwWydfJy5jaGFyQ29kZUF0KDApXSA9IDYzXG5cbmZ1bmN0aW9uIHBsYWNlSG9sZGVyc0NvdW50IChiNjQpIHtcbiAgdmFyIGxlbiA9IGI2NC5sZW5ndGhcbiAgaWYgKGxlbiAlIDQgPiAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0JylcbiAgfVxuXG4gIC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG4gIC8vIGlmIHRoZXJlIGFyZSB0d28gcGxhY2Vob2xkZXJzLCB0aGFuIHRoZSB0d28gY2hhcmFjdGVycyBiZWZvcmUgaXRcbiAgLy8gcmVwcmVzZW50IG9uZSBieXRlXG4gIC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuICAvLyB0aGlzIGlzIGp1c3QgYSBjaGVhcCBoYWNrIHRvIG5vdCBkbyBpbmRleE9mIHR3aWNlXG4gIHJldHVybiBiNjRbbGVuIC0gMl0gPT09ICc9JyA/IDIgOiBiNjRbbGVuIC0gMV0gPT09ICc9JyA/IDEgOiAwXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKGI2NCkge1xuICAvLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcbiAgcmV0dXJuIChiNjQubGVuZ3RoICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzQ291bnQoYjY0KVxufVxuXG5mdW5jdGlvbiB0b0J5dGVBcnJheSAoYjY0KSB7XG4gIHZhciBpLCBsLCB0bXAsIHBsYWNlSG9sZGVycywgYXJyXG4gIHZhciBsZW4gPSBiNjQubGVuZ3RoXG4gIHBsYWNlSG9sZGVycyA9IHBsYWNlSG9sZGVyc0NvdW50KGI2NClcblxuICBhcnIgPSBuZXcgQXJyKChsZW4gKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnMpXG5cbiAgLy8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuICBsID0gcGxhY2VIb2xkZXJzID4gMCA/IGxlbiAtIDQgOiBsZW5cblxuICB2YXIgTCA9IDBcblxuICBmb3IgKGkgPSAwOyBpIDwgbDsgaSArPSA0KSB7XG4gICAgdG1wID0gKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTgpIHwgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDEyKSB8IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA8PCA2KSB8IHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMyldXG4gICAgYXJyW0wrK10gPSAodG1wID4+IDE2KSAmIDB4RkZcbiAgICBhcnJbTCsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW0wrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG4gICAgdG1wID0gKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMikgfCAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPj4gNClcbiAgICBhcnJbTCsrXSA9IHRtcCAmIDB4RkZcbiAgfSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcbiAgICB0bXAgPSAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxMCkgfCAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgNCkgfCAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPj4gMilcbiAgICBhcnJbTCsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW0wrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICByZXR1cm4gYXJyXG59XG5cbmZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG4gIHJldHVybiBsb29rdXBbbnVtID4+IDE4ICYgMHgzRl0gKyBsb29rdXBbbnVtID4+IDEyICYgMHgzRl0gKyBsb29rdXBbbnVtID4+IDYgJiAweDNGXSArIGxvb2t1cFtudW0gJiAweDNGXVxufVxuXG5mdW5jdGlvbiBlbmNvZGVDaHVuayAodWludDgsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHRtcFxuICB2YXIgb3V0cHV0ID0gW11cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpICs9IDMpIHtcbiAgICB0bXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG4gICAgb3V0cHV0LnB1c2godHJpcGxldFRvQmFzZTY0KHRtcCkpXG4gIH1cbiAgcmV0dXJuIG91dHB1dC5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBmcm9tQnl0ZUFycmF5ICh1aW50OCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW4gPSB1aW50OC5sZW5ndGhcbiAgdmFyIGV4dHJhQnl0ZXMgPSBsZW4gJSAzIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG4gIHZhciBvdXRwdXQgPSAnJ1xuICB2YXIgcGFydHMgPSBbXVxuICB2YXIgbWF4Q2h1bmtMZW5ndGggPSAxNjM4MyAvLyBtdXN0IGJlIG11bHRpcGxlIG9mIDNcblxuICAvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4yID0gbGVuIC0gZXh0cmFCeXRlczsgaSA8IGxlbjI7IGkgKz0gbWF4Q2h1bmtMZW5ndGgpIHtcbiAgICBwYXJ0cy5wdXNoKGVuY29kZUNodW5rKHVpbnQ4LCBpLCAoaSArIG1heENodW5rTGVuZ3RoKSA+IGxlbjIgPyBsZW4yIDogKGkgKyBtYXhDaHVua0xlbmd0aCkpKVxuICB9XG5cbiAgLy8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuICBpZiAoZXh0cmFCeXRlcyA9PT0gMSkge1xuICAgIHRtcCA9IHVpbnQ4W2xlbiAtIDFdXG4gICAgb3V0cHV0ICs9IGxvb2t1cFt0bXAgPj4gMl1cbiAgICBvdXRwdXQgKz0gbG9va3VwWyh0bXAgPDwgNCkgJiAweDNGXVxuICAgIG91dHB1dCArPSAnPT0nXG4gIH0gZWxzZSBpZiAoZXh0cmFCeXRlcyA9PT0gMikge1xuICAgIHRtcCA9ICh1aW50OFtsZW4gLSAyXSA8PCA4KSArICh1aW50OFtsZW4gLSAxXSlcbiAgICBvdXRwdXQgKz0gbG9va3VwW3RtcCA+PiAxMF1cbiAgICBvdXRwdXQgKz0gbG9va3VwWyh0bXAgPj4gNCkgJiAweDNGXVxuICAgIG91dHB1dCArPSBsb29rdXBbKHRtcCA8PCAyKSAmIDB4M0ZdXG4gICAgb3V0cHV0ICs9ICc9J1xuICB9XG5cbiAgcGFydHMucHVzaChvdXRwdXQpXG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJycpXG59XG4iLCJcclxuLypqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXHJcblxyXG5jb25zdCB0aHJlZSA9IHJlcXVpcmUoXCIuL3RocmVlanMvYmxlbmRfdGhyZWUuanNcIik7XHJcblxyXG5jb25zdCBwYXJzZXIgPSByZXF1aXJlKFwiLi9wYXJzZXIvcGFyc2VyLmpzXCIpKCk7XHJcblxyXG5cclxuZnVuY3Rpb24gbG9hZEZpbGUoYmxlbmRlcl9maWxlLCByZXMsIHJlail7XHRcclxuXHR0aHJlZV9tb2R1bGUgPSB0aHJlZShibGVuZGVyX2ZpbGUpO1xyXG5cclxuXHQvL1RPRE86IFJlcG9ydCBhbnkgZXJyb3JzIHdpdGggVGhyZWVKUyBiZWZvcmUgY29udGludWluZy5cclxuXHRcclxuXHRyZXMoe1xyXG5cdFx0ZmlsZSA6IGJsZW5kZXJfZmlsZSxcclxuXHRcdHRocmVlIDogdGhyZWVfbW9kdWxlXHJcblx0fSk7XHJcbn1cclxuXHJcbi8qIFRoaXMgcmVwcmVzZW50cyBhIHBhcnNlZCBibGVuZGZpbGUgaW5zdGFuY2UgaWYgcGFyc2luZyBpcyBzdWNjZXNzZnVsLiBJdCB3aWxsIGFjY2VwdCBhIHN0cmluZyBvciBhIGJpbmFyeSBkYXRhIG9iamVjdC4gU3RyaW5ncyBtdXN0IGJlIGEgdmFsaWQgVVJJIHRvIGEgYmxlbmRlciBmaWxlLiBCaW5hcnkgZGF0YSBtYXkgYmUgaW4gdGhlIGZvcm0gb2YgYW4gQXJyYXlCdWZmZXIsIFR5cGVkQXJyYXksIG9yIGEgQmxvYi4gQmluYXJ5IGRhdGEgbXVzdCBhbHNvIGNvbnRhaW4gdGhlIGJpbmFyeSBkYXRhIG9mIGEgYmxlbmRlciBmaWxlLiovXHJcblxyXG5KU0JMRU5EID0gKGZpbGV1cmlfb3JfZmlsZWRhdGEsIG5hbWUgPSBcIlwiKT0+e1xyXG5cclxuXHRjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoXHJcblx0XHQocmVzLCByZWopID0+e1xyXG5cdFx0XHRwYXJzZXIub25QYXJzZVJlYWR5ID0gKGJsZW5kZXJfZmlsZSkgPT4ge1xyXG5cdFx0XHRcdGxvYWRGaWxlKGJsZW5kZXJfZmlsZSwgcmVzLCByZWopO1xyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0Ly9JZiBmaWxldXJpX29yX2ZpbGVkYXRhIGlzIGEgc3RyaW5nLCBhdHRlbXB0IHRvIGxvYWQgdGhlIGZpbGUgYXN5bmNocm9ub3VzbHlcclxuXHRcdFx0aWYodHlwZW9mIGZpbGV1cmlfb3JfZmlsZWRhdGEgPT0gXCJzdHJpbmdcIil7XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0bGV0IHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHRcdFx0ICAgIFxyXG5cdFx0XHQgICAgcmVxdWVzdC5vcGVuKFwiR0VUXCIsIGZpbGV1cmlfb3JfZmlsZWRhdGEsIHRydWUpO1xyXG5cdFx0XHQgICAgXHJcblx0XHRcdCAgICByZXF1ZXN0LnJlc3BvbnNlVHlwZSA9ICdibG9iJztcclxuXHRcdFx0ICAgIFxyXG5cdFx0XHQgICAgcmVxdWVzdC5vbmxvYWQgPSAoKSA9PiB7XHJcblx0XHRcdCAgICAgICAgbGV0IGZpbGUgPSByZXF1ZXN0LnJlc3BvbnNlO1xyXG5cdFx0XHQgICAgICAgIFxyXG5cdFx0XHQgICAgICAgIHBhcnNlci5sb2FkQmxlbmRGcm9tQmxvYihuZXcgQmxvYihbZmlsZV0pLCBmaWxldXJpX29yX2ZpbGVkYXRhKTtcclxuXHRcdFx0ICAgIH07XHJcblx0XHRcdCAgICBcclxuXHRcdFx0ICAgIHJlcXVlc3Quc2VuZCgpO1xyXG5cclxuXHRcdFx0ICAgIHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRkZWJ1Z2dlclxyXG5cclxuXHRcdFx0aWYodHlwZW9mIGZpbGV1cmlfb3JfZmlsZWRhdGEgPT0gXCJvYmplY3RcIil7XHJcblx0XHRcdFx0Ly9BdHRlbXB0IHRvIGxvYWQgZnJvbSBibG9iIG9yIGFycmF5IGJ1ZmZlcjtcclxuXHRcdFx0XHRpZihmaWxldXJpX29yX2ZpbGVkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpe1xyXG5cdFx0XHRcdFx0cGFyc2VyLmxvYWRCbGVuZEZyb21BcnJheUJ1ZmZlcihmaWxldXJpX29yX2ZpbGVkYXRhLCBuYW1lKTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmKGZpbGV1cmlfb3JfZmlsZWRhdGEgaW5zdGFuY2VvZiBCbG9iKXtcclxuXHRcdFx0XHRcdHBhcnNlci5sb2FkQmxlbmRGcm9tQmxvYihmaWxldXJpX29yX2ZpbGVkYXRhLCBuYW1lKTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vVW5rbm93biBmaWxlIHR5cGUgcGFzc2VkIC0+IGFib3J0IGFuZCByZWplY3RcclxuXHJcblx0XHRcdGNvbnNvbGUud2FybihcIlVuc3VwcG9ydGVkIGZpbGUgdHlwZSBwYXNzZWQgdG8gSlNCbGVuZFwiLCBmaWxldXJpX29yX2ZpbGVkYXRhKTtcclxuXHRcdFx0XHJcblx0XHRcdHJlaihcIlVuc3VwcG9ydGVkIGZpbGUgdHlwZSBwYXNzZWQgdG8gSlNCbGVuZFwiKTtcclxuXHRcdH1cclxuXHQpO1xyXG5cclxuXHRyZXR1cm4gcHJvbWlzZTtcclxufTsiLCIvKmpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuY29uc3QgRE5BMSA9IDgyNjM2MzQ2MDtcbmNvbnN0IEVOREIgPSAxMTExNzcyNzQxO1xuXG4vKiBOb3RlOiBCbGVuZGVyIGNvb3JpZGluYXRlcyB0cmVhdCB0aGUgWiBheGlzIGFzIHRoZSB2ZXJ0aWNsZSBhbmQgIFkgYXMgZGVwdGguICovXG5tb2R1bGUuZXhwb3J0cyAgPSAoZnVuY3Rpb24odW56aXBwZXIpIHtcbiAgICAvL0EgaGVscGVyIG9iamVjdCB0byBpZGVudGlmeSBCbGVuZGVyIE9iamVjdCBzdHJ1Y3RzIGJ5IHR5cGUgbmFtZS4gXG4gICAgdmFyIGJsZW5kZXJfdHlwZXMgPSB7XG4gICAgICAgIG1lc2hfb2JqZWN0OiAxLFxuICAgICAgICBsYW1wOiAxMCxcbiAgICB9O1xuXG4gICAgLy93ZWIgd29ya2VyIG5vdCBmdW5jdGlvbmFsIGluIHRoaXMgdmVyc2lvblxuICAgIFVTRV9XRUJXT1JLRVIgPSBmYWxzZTtcblxuICAgIHZhciB3b3JrZXIgPSBudWxsLFxuXG4gICAgICAgIEZSID0gbmV3IEZpbGVSZWFkZXIoKSxcblxuICAgICAgICByZXR1cm5fb2JqZWN0ID0ge1xuICAgICAgICAgICAgbG9hZEJsZW5kRnJvbUFycmF5QnVmZmVyOiBmdW5jdGlvbihhcnJheV9idWZmZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm5fb2JqZWN0LnJlYWR5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKFVTRV9XRUJXT1JLRVIpIHtcbiAgICAgICAgICAgICAgICAgICAgd29ya2VyLnBvc3RNZXNzYWdlKGFycmF5X2J1ZmZlciwgYXJyYXlfYnVmZmVyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB3b3JrZXIub25tZXNzYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGFycmF5X2J1ZmZlclxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbG9hZEJsZW5kRnJvbUJsb2I6IGZ1bmN0aW9uKGJsb2IpIHtcbiAgICAgICAgICAgICAgICBGUi5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuX29iamVjdC5sb2FkQmxlbmRGcm9tQXJyYXlCdWZmZXIodGhpcy5yZXN1bHQpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgRlIucmVhZEFzQXJyYXlCdWZmZXIoYmxvYik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVhZHk6IHRydWUsXG4gICAgICAgICAgICBvblBhcnNlUmVhZHk6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgIH07XG5cbiAgICB3b3JrZXIgPSBuZXcgd29ya2VyX2NvZGUoKTtcblxuICAgIHdvcmtlci5wb3N0TWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuX29iamVjdC5vblBhcnNlUmVhZHkobWVzc2FnZSk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHdvcmtlcl9jb2RlKCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICB2YXIgZGF0YSA9IG51bGwsXG4gICAgICAgICAgICBfZGF0YSA9IG51bGwsXG4gICAgICAgICAgICBCSUdfRU5ESUFOID0gZmFsc2UsXG4gICAgICAgICAgICBwb2ludGVyX3NpemUgPSAwLFxuICAgICAgICAgICAgc3RydWN0X25hbWVzID0gW10sXG4gICAgICAgICAgICBvZmZzZXQgPSAwLFxuICAgICAgICAgICAgd29ya2luZ19ibGVuZF9maWxlID0gbnVsbCxcbiAgICAgICAgICAgIGN1cnJlbnRfU0ROQV90ZW1wbGF0ZSA9IG51bGwsXG4gICAgICAgICAgICB0ZW1wbGF0ZXMgPSB7fSxcbiAgICAgICAgICAgIGZpbmlzaGVkX29iamVjdHMgPSBbXSxcbiAgICAgICAgICAgIEZJTEUgPSBudWxsLFxuICAgICAgICAgICAgQUIgPSBudWxsO1xuXG4gICAgICAgIGZ1bmN0aW9uIHBhcnNlRmlsZShtc2cpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbXNnLmRhdGEgPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIC8vIHJlc2V0IGdsb2JhbCB2YXJpYWJsZXNcbiAgICAgICAgICAgICAgICBBQiA9IG51bGw7XG4gICAgICAgICAgICAgICAgZGF0YSA9IG51bGw7XG4gICAgICAgICAgICAgICAgQklHX0VORElBTiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHBvaW50ZXJfc2l6ZSA9IDA7XG4gICAgICAgICAgICAgICAgc3RydWN0X25hbWVzID0gW107XG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gMDtcbiAgICAgICAgICAgICAgICB3b3JraW5nX2JsZW5kX2ZpbGUgPSBudWxsO1xuICAgICAgICAgICAgICAgIGZpbmlzaGVkX29iamVjdHMgPSBbXTtcbiAgICAgICAgICAgICAgICBjdXJyZW50X1NETkFfdGVtcGxhdGUgPSBudWxsO1xuXG5cbiAgICAgICAgICAgICAgICAvLyBzZXQgZGF0YVxuICAgICAgICAgICAgICAgIF9kYXRhID0gbXNnLmRhdGE7XG5cbiAgICAgICAgICAgICAgICBBQiA9IF9kYXRhLnNsaWNlKCk7XG5cbiAgICAgICAgICAgICAgICBkYXRhID0gbmV3IERhdGFWaWV3KF9kYXRhKTtcblxuXG4gICAgICAgICAgICAgICAgRklMRSA9IG5ldyBCTEVOREVSX0ZJTEUoQUIpO1xuXG4gICAgICAgICAgICAgICAgLy9zdGFydCBwYXJzaW5nXG4gICAgICAgICAgICAgICAgcmVhZEZpbGUoKTtcblxuICAgICAgICAgICAgICAgIC8vZXhwb3J0IHBhcnNlZCBkYXRhXG4gICAgICAgICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZShGSUxFKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qXG4gICAgICAgICAgICBFeHBvcnQgb2JqZWN0IGZvciBhIHBhcnNlZCBfX2JsZW5kZXJfZmlsZV9fLlxuICAgICAgICAqL1xuXG4gICAgICAgIHZhciBCTEVOREVSX0ZJTEUgPSBmdW5jdGlvbihBQikge1xuICAgICAgICAgICAgdGhpcy5BQiA9IEFCO1xuICAgICAgICAgICAgLy90aGlzLmRvdWJsZSA9IG5ldyBGbG9hdDY0QXJyYXkoQUIpO1xuICAgICAgICAgICAgdGhpcy5ieXRlID0gbmV3IFVpbnQ4QXJyYXkoQUIpO1xuXG4gICAgICAgICAgICB0aGlzLmR2ID0gbmV3IERhdGFWaWV3KEFCKTtcblxuICAgICAgICAgICAgdGhpcy5vYmplY3RzID0ge307XG4gICAgICAgICAgICB0aGlzLm1lbW9yeV9sb29rdXAgPSB7fSxcbiAgICAgICAgICAgICAgICB0aGlzLm9iamVjdF9hcnJheSA9IFtdO1xuXG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICBCTEVOREVSX0ZJTEUucHJvdG90eXBlID0ge1xuICAgICAgICAgICAgYWRkT2JqZWN0OiBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9iamVjdF9hcnJheS5wdXNoKG9iaik7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLm9iamVjdHNbb2JqLmJsZW5kZXJfbmFtZV0pIHRoaXMub2JqZWN0c1tvYmouYmxlbmRlcl9uYW1lXSA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0c1tvYmouYmxlbmRlcl9uYW1lXS5wdXNoKG9iaik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJpbWVUeXBlczogZnVuY3Rpb24obGlzdF9vZl9kbmFfbmFtZXMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3Rfb2ZfZG5hX25hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vdGhpcy5vYmplY3RzW2xpc3Rfb2ZfZG5hX25hbWVzW2ldXSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRQb2ludGVyOiBmdW5jdGlvbihvZmZzZXQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcG9pbnRlckxvdyA9IHRoaXMuZHYuZ2V0VWludDMyKG9mZnNldCwgdGhpcy50ZW1wbGF0ZS5lbmRpYW5lc3MpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRlbXBsYXRlLnBvaW50ZXJfc2l6ZSA+IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvaW50ZXJIaWdoID0gdGhpcy5kdi5nZXRVaW50MzIob2Zmc2V0ICsgNCwgdGhpcy50ZW1wbGF0ZS5lbmRpYW5lc3MpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50ZW1wbGF0ZS5lbmRpYW5lc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAocG9pbnRlckxvdykgKyBcImx8aFwiICsgcG9pbnRlckhpZ2g7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHBvaW50ZXJIaWdoKSArIFwiaHxsXCIgKyBwb2ludGVyTG93O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBvaW50ZXJMb3c7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGZ1bmN0aW9uIGdldERvY3VtZW50KGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBvYmogPSByZWFkRmlsZShudWxsLCBkYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYub25tZXNzYWdlID0gcGFyc2VGaWxlO1xuICAgICAgICB0aGlzLm9ubWVzc2FnZSA9IHBhcnNlRmlsZTtcblxuICAgICAgICAvKlxuICAgICAgICAgICAgVGhlc2UgZnVuY3Rpb25zIG1hcCBvZmZzZXRzIGluIHRoZSBibGVuZGVyIF9fYmxlbmRlcl9maWxlX18gdG8gYmFzaWMgdHlwZXMgKGJ5dGUsc2hvcnQsaW50LGZsb2F0KSB0aHJvdWdoIFR5cGVkQXJyYXlzO1xuICAgICAgICAgICAgVGhpcyBhbGxvd3MgdGhlIHVuZGVybHlpbmcgYmluYXJ5IGRhdGEgdG8gYmUgY2hhbmdlZC5cbiAgICAgICAgKi9cblxuICAgICAgICBmdW5jdGlvbiBmbG9hdDY0UHJvcChvZmZzZXQsIEJsZW5kZXJfQXJyYXlfTGVuZ3RoLCBsZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChCbGVuZGVyX0FycmF5X0xlbmd0aCA+IDEpID9cbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBGbG9hdDY0QXJyYXkodGhpcy5fX2JsZW5kZXJfZmlsZV9fLkFCLCB0aGlzLl9fZGF0YV9hZGRyZXNzX18gKyBvZmZzZXQsIGxlbmd0aCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2JsZW5kZXJfZmlsZV9fLmR2LmdldEZsb2F0NjQodGhpcy5fX2RhdGFfYWRkcmVzc19fICsgb2Zmc2V0LCB0aGlzLl9fYmxlbmRlcl9maWxlX18udGVtcGxhdGUuZW5kaWFuZXNzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldDogZnVuY3Rpb24oZmxvYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEJsZW5kZXJfQXJyYXlfTGVuZ3RoID4gMSkge30gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9fYmxlbmRlcl9maWxlX18uZHYuc2V0RmxvYXQ2NCh0aGlzLl9fZGF0YV9hZGRyZXNzX18gKyBvZmZzZXQsIGZsb2F0LCB0aGlzLl9fYmxlbmRlcl9maWxlX18udGVtcGxhdGUuZW5kaWFuZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZmxvYXRQcm9wKG9mZnNldCwgQmxlbmRlcl9BcnJheV9MZW5ndGgsIGxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKEJsZW5kZXJfQXJyYXlfTGVuZ3RoID4gMSkgP1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheSh0aGlzLl9fYmxlbmRlcl9maWxlX18uQUIsIHRoaXMuX19kYXRhX2FkZHJlc3NfXyArIG9mZnNldCwgbGVuZ3RoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9fYmxlbmRlcl9maWxlX18uZHYuZ2V0RmxvYXQzMih0aGlzLl9fZGF0YV9hZGRyZXNzX18gKyBvZmZzZXQsIHRoaXMuX19ibGVuZGVyX2ZpbGVfXy50ZW1wbGF0ZS5lbmRpYW5lc3MpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihmbG9hdCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoQmxlbmRlcl9BcnJheV9MZW5ndGggPiAxKSB7fSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX19ibGVuZGVyX2ZpbGVfXy5kdi5zZXRGbG9hdDMyKHRoaXMuX19kYXRhX2FkZHJlc3NfXyArIG9mZnNldCwgZmxvYXQsIHRoaXMuX19ibGVuZGVyX2ZpbGVfXy50ZW1wbGF0ZS5lbmRpYW5lc3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBpbnRQcm9wKG9mZnNldCwgQmxlbmRlcl9BcnJheV9MZW5ndGgsIGxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKEJsZW5kZXJfQXJyYXlfTGVuZ3RoID4gMSkgP1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEludDMyQXJyYXkodGhpcy5fX2JsZW5kZXJfZmlsZV9fLkFCLCB0aGlzLl9fZGF0YV9hZGRyZXNzX18gKyBvZmZzZXQsIGxlbmd0aCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2JsZW5kZXJfZmlsZV9fLmR2LmdldEludDMyKHRoaXMuX19kYXRhX2FkZHJlc3NfXyArIG9mZnNldCwgdGhpcy5fX2JsZW5kZXJfZmlsZV9fLnRlbXBsYXRlLmVuZGlhbmVzcyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKGludCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoQmxlbmRlcl9BcnJheV9MZW5ndGggPiAxKSB7fSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX19ibGVuZGVyX2ZpbGVfXy5kdi5zZXRJbnQzMih0aGlzLl9fZGF0YV9hZGRyZXNzX18gKyBvZmZzZXQsIGZsb2F0LCB0aGlzLl9fYmxlbmRlcl9maWxlX18udGVtcGxhdGUuZW5kaWFuZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdUludFByb3Aob2Zmc2V0LCBCbGVuZGVyX0FycmF5X0xlbmd0aCwgbGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoQmxlbmRlcl9BcnJheV9MZW5ndGggPiAxKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgVWludDMyQXJyYXkodGhpcy5fX2JsZW5kZXJfZmlsZV9fLkFCLCB0aGlzLl9fZGF0YV9hZGRyZXNzX18gKyBvZmZzZXQsIGxlbmd0aCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2JsZW5kZXJfZmlsZV9fLmR2LmdldFVpbnQzMih0aGlzLl9fZGF0YV9hZGRyZXNzX18gKyBvZmZzZXQsIHRoaXMuX19ibGVuZGVyX2ZpbGVfXy50ZW1wbGF0ZS5lbmRpYW5lc3MpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihpbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEJsZW5kZXJfQXJyYXlfTGVuZ3RoID4gMSkge30gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9fYmxlbmRlcl9maWxlX18uZHYuc2V0VWludDMyKHRoaXMuX19kYXRhX2FkZHJlc3NfXyArIG9mZnNldCwgZmxvYXQsIHRoaXMuX19ibGVuZGVyX2ZpbGVfXy50ZW1wbGF0ZS5lbmRpYW5lc3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBzaG9ydFByb3Aob2Zmc2V0LCBCbGVuZGVyX0FycmF5X0xlbmd0aCwgbGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoQmxlbmRlcl9BcnJheV9MZW5ndGggPiAxKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgSW50MTZBcnJheSh0aGlzLl9fYmxlbmRlcl9maWxlX18uQUIsIHRoaXMuX19kYXRhX2FkZHJlc3NfXyArIG9mZnNldCwgbGVuZ3RoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9fYmxlbmRlcl9maWxlX18uZHYuZ2V0SW50MTYodGhpcy5fX2RhdGFfYWRkcmVzc19fICsgb2Zmc2V0LCB0aGlzLl9fYmxlbmRlcl9maWxlX18udGVtcGxhdGUuZW5kaWFuZXNzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldDogZnVuY3Rpb24oZmxvYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEJsZW5kZXJfQXJyYXlfTGVuZ3RoID4gMSkge30gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9fYmxlbmRlcl9maWxlX18uZHYuc2V0SW50MTYodGhpcy5fX2RhdGFfYWRkcmVzc19fICsgb2Zmc2V0LCBmbG9hdCwgdGhpcy5fX2JsZW5kZXJfZmlsZV9fLnRlbXBsYXRlLmVuZGlhbmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB1U2hvcnRQcm9wID0gKG9mZnNldCwgQmxlbmRlcl9BcnJheV9MZW5ndGgsIGxlbmd0aCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKEJsZW5kZXJfQXJyYXlfTGVuZ3RoID4gMSkgP1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFVpbnQxNkFycmF5KHRoaXMuX19ibGVuZGVyX2ZpbGVfXy5BQiwgdGhpcy5fX2RhdGFfYWRkcmVzc19fICsgb2Zmc2V0LCBsZW5ndGgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX19ibGVuZGVyX2ZpbGVfXy5kdi5nZXRVaW50MTYodGhpcy5fX2RhdGFfYWRkcmVzc19fICsgb2Zmc2V0LCB0aGlzLl9fYmxlbmRlcl9maWxlX18udGVtcGxhdGUuZW5kaWFuZXNzKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldDogZnVuY3Rpb24oZmxvYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEJsZW5kZXJfQXJyYXlfTGVuZ3RoID4gMSkge30gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9fYmxlbmRlcl9maWxlX18uZHYuc2V0VWludDE2KHRoaXMuX19kYXRhX2FkZHJlc3NfXyArIG9mZnNldCwgZmxvYXQsIHRoaXMuX19ibGVuZGVyX2ZpbGVfXy50ZW1wbGF0ZS5lbmRpYW5lc3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZ1bmN0aW9uIGNoYXJQcm9wKG9mZnNldCwgQmxlbmRlcl9BcnJheV9MZW5ndGgsIGxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoQmxlbmRlcl9BcnJheV9MZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc3RhcnQgPSB0aGlzLl9fZGF0YV9hZGRyZXNzX18gKyBvZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW5kID0gc3RhcnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYnVmZmVyX2d1YXJkID0gMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMuX19ibGVuZGVyX2ZpbGVfXy5ieXRlW2VuZF0gIT0gMCAmJiBidWZmZXJfZ3VhcmQrKyA8IGxlbmd0aCkgZW5kKys7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0b1N0cmluZyh0aGlzLl9fYmxlbmRlcl9maWxlX18uQUIsIHN0YXJ0LCBlbmQpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX19ibGVuZGVyX2ZpbGVfXy5ieXRlWyh0aGlzLl9fZGF0YV9hZGRyZXNzX18gKyBvZmZzZXQpXTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldDogZnVuY3Rpb24oYnl0ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoQmxlbmRlcl9BcnJheV9MZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RyaW5nID0gYnl0ZSArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbCA9IHN0cmluZy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaSA8IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpIDwgbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9fYmxlbmRlcl9maWxlX18uYnl0ZVsodGhpcy5fX2RhdGFfYWRkcmVzc19fICsgb2Zmc2V0ICsgaSldID0gc3RyaW5nLmNoYXJDb2RlQXQoaSkgfCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX19ibGVuZGVyX2ZpbGVfXy5ieXRlWyh0aGlzLl9fZGF0YV9hZGRyZXNzX18gKyBvZmZzZXQgKyBpKV0gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9fYmxlbmRlcl9maWxlX18uYnl0ZVsodGhpcy5fX2RhdGFfYWRkcmVzc19fICsgb2Zmc2V0KV0gPSBieXRlIHwgMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwb2ludGVyUHJvcDIob2Zmc2V0KSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwb2ludGVyID0gdGhpcy5fX2JsZW5kZXJfZmlsZV9fLmdldFBvaW50ZXIodGhpcy5fX2RhdGFfYWRkcmVzc19fICsgb2Zmc2V0LCB0aGlzLl9fYmxlbmRlcl9maWxlX18pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGluayA9IHRoaXMuX19ibGVuZGVyX2ZpbGVfXy5tZW1vcnlfbG9va3VwW3BvaW50ZXJdO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHRzID0gW107XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZGRyZXNzID0gbGluay5fX2RhdGFfYWRkcmVzc19fO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGogPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludGVyID0gdGhpcy5fX2JsZW5kZXJfZmlsZV9fLmdldFBvaW50ZXIoYWRkcmVzcyArIGogKiA4LCB0aGlzLl9fYmxlbmRlcl9maWxlX18pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBvYmogPSB0aGlzLl9fYmxlbmRlcl9maWxlX18ubWVtb3J5X2xvb2t1cFtwb2ludGVyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9iaikgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG9iaik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaisrXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldDogZnVuY3Rpb24oKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcG9pbnRlclByb3Aob2Zmc2V0LCBCbGVuZGVyX0FycmF5X0xlbmd0aCwgbGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChCbGVuZGVyX0FycmF5X0xlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBhcnJheSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGogPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG9mZiA9IG9mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChqIDwgQmxlbmRlcl9BcnJheV9MZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcG9pbnRlciA9IHRoaXMuX19ibGVuZGVyX2ZpbGVfXy5nZXRQb2ludGVyKHRoaXMuX19kYXRhX2FkZHJlc3NfXyArIG9mZiwgdGhpcy5fX2JsZW5kZXJfZmlsZV9fKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5LnB1c2godGhpcy5fX2JsZW5kZXJfZmlsZV9fLm1lbW9yeV9sb29rdXBbcG9pbnRlcl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZiArPSBsZW5ndGggLy8vdGhpcy5fX2JsZW5kZXJfZmlsZV9fLnRlbXBsYXRlLnBvaW50ZXJfc2l6ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhcnJheTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwb2ludGVyID0gdGhpcy5fX2JsZW5kZXJfZmlsZV9fLmdldFBvaW50ZXIodGhpcy5fX2RhdGFfYWRkcmVzc19fICsgb2Zmc2V0LCB0aGlzLl9fYmxlbmRlcl9maWxlX18pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX19ibGVuZGVyX2ZpbGVfXy5tZW1vcnlfbG9va3VwW3BvaW50ZXJdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKCkge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXBpbGVQcm9wKG9iaiwgbmFtZSwgdHlwZSwgb2Zmc2V0LCBhcnJheV9zaXplLCBJU19QT0lOVEVSLCBwb2ludGVyX3NpemUsIGxlbmd0aCkge1xuXG4gICAgICAgICAgICBpZiAoIUlTX1BPSU5URVIpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImRvdWJsZVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgbmFtZSwgZmxvYXQ2NFByb3Aob2Zmc2V0LCBhcnJheV9zaXplLCBsZW5ndGggPj4gMykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJmbG9hdFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgbmFtZSwgZmxvYXRQcm9wKG9mZnNldCwgYXJyYXlfc2l6ZSwgbGVuZ3RoID4+IDIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaW50XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBuYW1lLCBpbnRQcm9wKG9mZnNldCwgYXJyYXlfc2l6ZSwgbGVuZ3RoID4+IDIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwic2hvcnRcIjpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInVzaG9ydFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgbmFtZSwgc2hvcnRQcm9wKG9mZnNldCwgYXJyYXlfc2l6ZSwgbGVuZ3RoID4+IDEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY2hhclwiOlxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidWNoYXJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIG5hbWUsIGNoYXJQcm9wKG9mZnNldCwgYXJyYXlfc2l6ZSwgbGVuZ3RoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29tcGlsZSBsaXN0IHRvIFxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqW25hbWVdID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmouX19saXN0X18ucHVzaChuYW1lLCB0eXBlLCBsZW5ndGgsIG9mZnNldCwgYXJyYXlfc2l6ZSwgSVNfUE9JTlRFUik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG9iai5fbGVuZ3RoICs9IGxlbmd0aDtcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gbGVuZ3RoO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBuYW1lLCBwb2ludGVyUHJvcChvZmZzZXQsIGFycmF5X3NpemUsIHBvaW50ZXJfc2l6ZSkpO1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSBwb2ludGVyX3NpemUgKiBhcnJheV9zaXplO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb2Zmc2V0O1xuICAgICAgICB9XG5cbiAgICAgICAgLy9TdG9yZSBmaW5hbCBETkEgc3RydWN0c1xuICAgICAgICB2YXIgTUFTVEVSX1NETkFfU0NIRU1BID0gZnVuY3Rpb24odmVyc2lvbikge1xuICAgICAgICAgICAgdGhpcy52ZXJzaW9uID0gdmVyc2lvbjtcbiAgICAgICAgICAgIHRoaXMuU0ROQV9TRVQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuYnl0ZV9zaXplID0gMDtcbiAgICAgICAgICAgIHRoaXMuc3RydWN0X2luZGV4ID0gMDtcbiAgICAgICAgICAgIHRoaXMuc3RydWN0cyA9IHt9O1xuICAgICAgICAgICAgdGhpcy5TRE5BID0ge307XG4gICAgICAgICAgICB0aGlzLmVuZGlhbmVzcyA9IGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIE1BU1RFUl9TRE5BX1NDSEVNQS5wcm90b3R5cGUgPSB7XG4gICAgICAgICAgICBnZXRTRE5BU3RydWN0dXJlQ29uc3RydWN0b3I6IGZ1bmN0aW9uKG5hbWUsIHN0cnVjdCkge1xuICAgICAgICAgICAgICAgIGlmIChzdHJ1Y3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJsZW5fc3RydWN0ID0gRnVuY3Rpb24oXCJmdW5jdGlvbiBcIiArIG5hbWUgKyBcIigpe307IHJldHVybiBcIiArIG5hbWUpKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgYmxlbl9zdHJ1Y3QucHJvdG90eXBlID0gbmV3IEJMRU5ERVJfU1RSVUNUVVJFKCk7XG4gICAgICAgICAgICAgICAgICAgIGJsZW5fc3RydWN0LnByb3RvdHlwZS5ibGVuZGVyX25hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgICAgICBibGVuX3N0cnVjdC5wcm90b3R5cGUuX19wb2ludGVycyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBibGVuX3N0cnVjdC5wcm90b3R5cGUuX19saXN0X18gPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgLy9DcmVhdGUgcHJvcGVydGllcyBvZiBzdHJ1Y3RcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJ1Y3QubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfbmFtZSA9IHN0cnVjdFtpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuID0gX25hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHN0cnVjdFtpICsgMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuZ3RoID0gc3RydWN0W2kgKyAyXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJheV9sZW5ndGggPSAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoID0gbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBCbGVuZGVyX0FycmF5X0xlbmd0aCA9IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU3VwYXJyYXlfbWF0Y2ggPSAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFBvaW50ZXJUb0FycmF5ID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUG9pbnRlcl9NYXRjaCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgRE5BID0gdGhpcy5TRE5BW25hbWVdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0cnVjdG9yOiBibGVuX3N0cnVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgb3JpZ2luYWxfbmFtZSA9IF9uYW1lO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL21pbmkgdHlwZSBwYXJzZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgobWF0Y2ggPSBfbmFtZS5tYXRjaCgvKFxcKj8pKFxcKj8pKFxcdyspKFxcWyhcXHcqKVxcXSk/KFxcWyhcXHcqKVxcXSk/LykpKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2Jhc2UgbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9uYW1lID0gbWF0Y2hbM107XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3BvaW50ZXIgdHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaFsxXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQb2ludGVyX01hdGNoID0gMTA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsZW5fc3RydWN0LnByb3RvdHlwZS5fX3BvaW50ZXJzLnB1c2goX25hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaFsyXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQb2ludGVyVG9BcnJheSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9hcnJheXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hbNF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoWzZdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdXBhcnJheV9tYXRjaCA9IHBhcnNlSW50KG1hdGNoWzVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEJsZW5kZXJfQXJyYXlfTGVuZ3RoID0gcGFyc2VJbnQobWF0Y2hbN10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQmxlbmRlcl9BcnJheV9MZW5ndGggPSBwYXJzZUludChtYXRjaFs1XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXlfbGVuZ3RoID0gQmxlbmRlcl9BcnJheV9MZW5ndGggKiBsZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuZ3RoID0gYXJyYXlfbGVuZ3RoICogU3VwYXJyYXlfbWF0Y2g7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIEROQVtuXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbmd0aDogbGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQXJyYXk6IChCbGVuZGVyX0FycmF5X0xlbmd0aCA+IDApLFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFBvaW50ZXJUb0FycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGJsZW5fc3RydWN0LnByb3RvdHlwZSwgX25hbWUsIHBvaW50ZXJQcm9wMihvZmZzZXQpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgKz0gcG9pbnRlcl9zaXplO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChTdXBhcnJheV9tYXRjaCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJyYXlfbmFtZXMgPSBuZXcgQXJyYXkoU3VwYXJyYXlfbWF0Y2gpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zdHJ1Y3Qgc3ViX2FycmF5IG9iamVjdCB0aGF0IHdpbGwgcmV0dXJuIHRoZSBjb3JyZWN0IHN0cnVjdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IFN1cGFycmF5X21hdGNoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGFycmF5X25hbWVfID0gYF9fJHtfbmFtZX1bJHtqfV1fX2A7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5X25hbWVzW2pdID0gYXJyYXlfbmFtZV87XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gY29tcGlsZVByb3AoYmxlbl9zdHJ1Y3QucHJvdG90eXBlLCBhcnJheV9uYW1lXywgdHlwZSwgb2Zmc2V0LCBCbGVuZGVyX0FycmF5X0xlbmd0aCwgUG9pbnRlcl9NYXRjaCwgcG9pbnRlcl9zaXplLCBhcnJheV9sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShibGVuX3N0cnVjdC5wcm90b3R5cGUsIF9uYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldDogKGZ1bmN0aW9uKGFycmF5X25hbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFycmF5ID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheV9uYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJheS5wdXNoKHRoaXNbYXJyYXlfbmFtZXNbaV1dKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKGFycmF5X25hbWVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSBjb21waWxlUHJvcChibGVuX3N0cnVjdC5wcm90b3R5cGUsIF9uYW1lLCB0eXBlLCBvZmZzZXQsIEJsZW5kZXJfQXJyYXlfTGVuZ3RoLCBQb2ludGVyX01hdGNoLCBwb2ludGVyX3NpemUsIGxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5TRE5BW25hbWVdLmNvbnN0cnVjdG9yO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLlNETkFbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLlNETkFbbmFtZV0uY29uc3RydWN0b3I7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBCTEVOREVSX1NUUlVDVFVSRSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5fX2JsZW5kZXJfZmlsZV9fID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX19saXN0X18gPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fX3N1cGVyX2FycmF5X2xpc3RfXyA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmJsZW5kZXJfbmFtZSA9IFwiXCI7XG4gICAgICAgICAgICB0aGlzLl9fcG9pbnRlcnMgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5hZGRyZXNzID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMubGVuZ3RoID0gMDtcbiAgICAgICAgICAgIHRoaXMuX19kYXRhX2FkZHJlc3NfXyA9IDA7XG4gICAgICAgICAgICB0aGlzLmJsZW5kZXJfbmFtZSA9IFwiXCI7XG4gICAgICAgICAgICB0aGlzLl9sZW5ndGggPSAwO1xuICAgICAgICB9O1xuXG5cbiAgICAgICAgLypcbiAgICAgICAgICAgIFJldHVybnMgYSBwcmUtY29uc3RydWN0ZWQgQkxFTkRFUl9TVFJVQ1RVUkUgb3IgY3JlYXRlcyBhIG5ldyBCTEVOREVSX1NUUlVDVFVSRSB0byBtYXRjaCB0aGUgRE5BIHN0cnVjdCB0eXBlXG4gICAgICAgICovXG4gICAgICAgIHZhciBwb2ludGVyX2Z1bmN0aW9uID0gKHBvaW50ZXIpID0+ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBGSUxFLm1lbW9yeV9sb29rdXBbcG9pbnRlcl1cbiAgICAgICAgfTtcblxuICAgICAgICBmdW5jdGlvbiBnZXRQb2ludGVyKG9mZnNldCkge1xuICAgICAgICAgICAgdmFyIHBvaW50ZXJMb3cgPSBkYXRhLmdldFVpbnQzMihvZmZzZXQsIEJJR19FTkRJQU4pO1xuICAgICAgICAgICAgaWYgKHBvaW50ZXJfc2l6ZSA+IDQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcG9pbnRlckhpZ2ggPSBkYXRhLmdldFVpbnQzMihvZmZzZXQgKyA0LCBCSUdfRU5ESUFOKTtcblxuICAgICAgICAgICAgICAgIGlmIChCSUdfRU5ESUFOKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAocG9pbnRlckxvdykgKyBcIlwiICsgcG9pbnRlckhpZ2g7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChwb2ludGVySGlnaCkgKyBcIlwiICsgcG9pbnRlckxvdztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBwb2ludGVyTG93O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgQkxFTkRFUl9TVFJVQ1RVUkUucHJvdG90eXBlID0ge1xuICAgICAgICAgICAgc2V0RGF0YTogZnVuY3Rpb24ocG9pbnRlciwgX2RhdGFfb2Zmc2V0LCBkYXRhX2Jsb2NrX2xlbmd0aCwgQkxFTkRFUl9GSUxFKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX19saXN0X18gPT0gbnVsbCkgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgQkxFTkRFUl9GSUxFLmFkZE9iamVjdCh0aGlzKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX19ibGVuZGVyX2ZpbGVfXyA9IEJMRU5ERVJfRklMRTtcblxuICAgICAgICAgICAgICAgIHZhciBzdHJ1Y3QgPSB0aGlzLl9fbGlzdF9fLFxuICAgICAgICAgICAgICAgICAgICBqID0gMCxcbiAgICAgICAgICAgICAgICAgICAgaSA9IDAsXG4gICAgICAgICAgICAgICAgICAgIG9iaiwgbmFtZSA9IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIHR5cGUsIGxlbmd0aCwgQmxlbmRlcl9BcnJheV9MZW5ndGgsIFBvaW50ZXJfTWF0Y2gsIG9mZnNldCwgY29uc3RydWN0b3I7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9fZGF0YV9hZGRyZXNzX18gPSBfZGF0YV9vZmZzZXQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoc3RydWN0ID09PSBudWxsKSByZXR1cm4gdGhpcztcblxuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzdHJ1Y3QubGVuZ3RoOyBpICs9IDYpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IHN0cnVjdFtpXTtcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHN0cnVjdFtpICsgMV07XG4gICAgICAgICAgICAgICAgICAgIEJsZW5kZXJfQXJyYXlfTGVuZ3RoID0gc3RydWN0W2kgKyA0XTtcbiAgICAgICAgICAgICAgICAgICAgUG9pbnRlcl9NYXRjaCA9IHN0cnVjdFtpICsgNV07XG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHRoaXMuX19kYXRhX2FkZHJlc3NfXyArIHN0cnVjdFtpICsgM107XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKEJsZW5kZXJfQXJyYXlfTGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1tuYW1lXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaiA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaiA8IEJsZW5kZXJfQXJyYXlfTGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRfU0ROQV90ZW1wbGF0ZS5nZXRTRE5BU3RydWN0dXJlQ29uc3RydWN0b3IodHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3RydWN0b3IgPSBjdXJyZW50X1NETkFfdGVtcGxhdGUuZ2V0U0ROQVN0cnVjdHVyZUNvbnN0cnVjdG9yKHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzW25hbWVdLnB1c2goKG5ldyBjb25zdHJ1Y3RvcigpKS5zZXREYXRhKDAsIG9mZnNldCwgb2Zmc2V0ICsgbGVuZ3RoIC8gQmxlbmRlcl9BcnJheV9MZW5ndGgsIEJMRU5ERVJfRklMRSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB0aGlzW25hbWVdLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ICs9IGxlbmd0aCAvIEJsZW5kZXJfQXJyYXlfTGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGorKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50X1NETkFfdGVtcGxhdGUuZ2V0U0ROQVN0cnVjdHVyZUNvbnN0cnVjdG9yKHR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3RydWN0b3IgPSBjdXJyZW50X1NETkFfdGVtcGxhdGUuZ2V0U0ROQVN0cnVjdHVyZUNvbnN0cnVjdG9yKHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbbmFtZV0gPSAobmV3IGNvbnN0cnVjdG9yKCkpLnNldERhdGEoMCwgb2Zmc2V0LCBsZW5ndGggKyBvZmZzZXQsIEJMRU5ERVJfRklMRSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgdGhpc1tuYW1lXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy9icmVhayBjb25uZWN0aW9uIHRvIGNvbmZpZ3VyYXRpb24gbGlzdFxuICAgICAgICAgICAgICAgIHRoaXMuX19saXN0X18gPSBudWxsO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZ2V0IGFuYW1lKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlkKSByZXR1cm4gdGhpcy5pZC5uYW1lLnNsaWNlKDIpO1xuICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBmdW5jdGlvbiB0b1N0cmluZyhidWZmZXIsIF9pbiwgX291dCkge1xuICAgICAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBuZXcgVWludDhBcnJheShidWZmZXIsIF9pbiwgX291dCAtIF9pbikpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9CZWdpbiBwYXJzaW5nIGJsZW5kZXIgX19ibGVuZGVyX2ZpbGVfX1xuICAgICAgICBmdW5jdGlvbiByZWFkRmlsZSgpIHtcbiAgICAgICAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0MiA9IDA7XG4gICAgICAgICAgICB2YXIgcm9vdCA9IDA7XG4gICAgICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgICAgICB2YXIgZGF0YV9vZmZzZXQgPSAwO1xuICAgICAgICAgICAgdmFyIHNkbmFfaW5kZXggPSAwO1xuICAgICAgICAgICAgdmFyIGNvZGUgPSBcIlwiO1xuICAgICAgICAgICAgdmFyIGJsb2NrX2xlbmd0aCA9IDA7XG4gICAgICAgICAgICB2YXIgY3Vycl9jb3VudCA9IDA7XG4gICAgICAgICAgICB2YXIgY3Vycl9jb3VudDIgPSAwO1xuXG4gICAgICAgICAgICBGSUxFLm1lbW9yeV9sb29rdXAgPSB7fTtcbiAgICAgICAgICAgIHN0cnVjdF9uYW1lcyA9IFtdO1xuICAgICAgICAgICAgb2Zmc2V0ID0gMDtcblxuICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHdlIGhhdmUgYSAuYmxlbmQgX19ibGVuZGVyX2ZpbGVfXy4gQWxsIGJsZW5kIGZpbGVzIGhhdmUgdGhlIGZpcnN0IDEyYnl0ZXNcbiAgICAgICAgICAgIC8vIHNldCB3aXRoIEJMRU5ERVItdiMjIyBpbiBVdGYtOFxuICAgICAgICAgICAgaWYgKHRvU3RyaW5nKF9kYXRhLCBvZmZzZXQsIDcpICE9PSBcIkJMRU5ERVJcIikgcmV0dXJuIGNvbnNvbGUud2FybihcIkZpbGUgc3VwcGxpZWQgaXMgbm90IGEgLmJsZW5kIGNvbXBhdGlibGUgQmxlbmRlciBmaWxlLlwiKTtcblxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGdldCB0ZW1wbGV0ZSBmcm9tIHNhdmUgdmVyc2lvbi5cblxuICAgICAgICAgICAgb2Zmc2V0ICs9IDc7XG4gICAgICAgICAgICBwb2ludGVyX3NpemUgPSAoKHRvU3RyaW5nKF9kYXRhLCBvZmZzZXQrKywgb2Zmc2V0KSkgPT0gXCJfXCIpID8gNCA6IDg7XG4gICAgICAgICAgICBCSUdfRU5ESUFOID0gdG9TdHJpbmcoX2RhdGEsIG9mZnNldCsrLCBvZmZzZXQpICE9PSBcIlZcIjtcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uID0gdG9TdHJpbmcoX2RhdGEsIG9mZnNldCwgb2Zmc2V0ICsgMyk7XG5cblxuICAgICAgICAgICAgLy9jcmVhdGUgbmV3IG1hc3RlciB0ZW1wbGF0ZSBpZiBub25lIGV4aXN0IGZvciBjdXJyZW50IGJsZW5kZXIgdmVyc2lvbjtcbiAgICAgICAgICAgIGlmICghdGVtcGxhdGVzW3ZlcnNpb25dKSB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVzW3ZlcnNpb25dID0gbmV3IE1BU1RFUl9TRE5BX1NDSEVNQSh2ZXJzaW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3VycmVudF9TRE5BX3RlbXBsYXRlID0gdGVtcGxhdGVzW3ZlcnNpb25dO1xuXG4gICAgICAgICAgICBGSUxFLnRlbXBsYXRlID0gY3VycmVudF9TRE5BX3RlbXBsYXRlO1xuXG4gICAgICAgICAgICBvZmZzZXQgKz0gMztcblxuICAgICAgICAgICAgLy9TZXQgU0ROQSBzdHJ1Y3RzIGlmIHRlbXBsYXRlIGhhc24ndCBiZWVuIHNldC5cbiAgICAgICAgICAgIC8vVG9kbzogTW92ZSB0aGUgZm9sbG93aW5nIGJsb2NrIGludG8gdGhlIE1BU1RFUl9TRE5BX1NDSEVNQSBvYmplY3QuXG4gICAgICAgICAgICAvLypMaWtlIHNvOiovIGN1cnJlbnRfU0ROQV90ZW1wbGF0ZS5zZXQoQUIpO1xuXG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRfU0ROQV90ZW1wbGF0ZS5TRE5BX1NFVCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRfU0ROQV90ZW1wbGF0ZS5lbmRpYW5lc3MgPSBCSUdfRU5ESUFOO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRfU0ROQV90ZW1wbGF0ZS5wb2ludGVyX3NpemUgPSBwb2ludGVyX3NpemU7XG4gICAgICAgICAgICAgICAgLy9maW5kIEROQTEgZGF0YSBibG9ja1xuICAgICAgICAgICAgICAgIG9mZnNldDIgPSBvZmZzZXQ7XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBzZG5hX2luZGV4ID0gZGF0YS5nZXRJbnQzMihvZmZzZXQyICsgcG9pbnRlcl9zaXplICsgOCwgQklHX0VORElBTik7XG4gICAgICAgICAgICAgICAgICAgIGNvZGUgPSB0b1N0cmluZyhfZGF0YSwgb2Zmc2V0Miwgb2Zmc2V0MiArIDQpLnJlcGxhY2UoL1xcdTAwMDAvZywgXCJcIik7XG4gICAgICAgICAgICAgICAgICAgIGJsb2NrX2xlbmd0aCA9IGRhdGEuZ2V0SW50MzIob2Zmc2V0MiArIDQsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXQyICs9IDE2ICsgKHBvaW50ZXJfc2l6ZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2RlID09PSBcIkROQTFcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRE5BIGZvdW5kOyBUaGlzIGlzIHRoZSBjb3JlIG9mIHRoZSBfX2JsZW5kZXJfZmlsZV9fIGFuZCBjb250YWlucyBhbGwgdGhlIHN0cnVjdHVyZSBmb3IgdGhlIHZhcmlvdXMgZGF0YSB0eXBlcyB1c2VkIGluIEJsZW5kZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHlwZXMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZHMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lcyA9IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbmd0aHMgPSBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lID0gXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyX25hbWUgPSBcIlwiO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3NraXAgU0ROQSBhbmQgTkFNRSBpZGVudGlmaWVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0MiArPSA4O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL051bWJlciBvZiBzdHJ1Y3RzLlxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQgPSBkYXRhLmdldEludDMyKG9mZnNldDIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0MiArPSA0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyX2NvdW50ID0gMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9CdWlsZCB1cCBsaXN0IG9mIG5hbWVzIGZvciBzdHJ1Y3RzXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY3Vycl9jb3VudCA8IGNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vycl9uYW1lID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoZGF0YS5nZXRJbnQ4KG9mZnNldDIpICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJfbmFtZSArPSB0b1N0cmluZyhfZGF0YSwgb2Zmc2V0Miwgb2Zmc2V0MiArIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQyKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVzLnB1c2goY3Vycl9uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQyKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vycl9jb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vQWRqdXN0IGZvciA0Ynl0ZSBhbGlnbm1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgob2Zmc2V0MiAlIDQpID4gMCkgb2Zmc2V0MiA9ICg0IC0gKG9mZnNldDIgJSA0KSkgKyBvZmZzZXQyO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0MiArPSA0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL051bWJlciBvZiBzdHJ1Y3QgdHlwZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ID0gZGF0YS5nZXRJbnQzMihvZmZzZXQyLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDIgKz0gNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJfY291bnQgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL0J1aWxkIHVwIGxpc3Qgb2YgdHlwZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChjdXJyX2NvdW50IDwgY291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyX25hbWUgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChkYXRhLmdldEludDgob2Zmc2V0MikgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vycl9uYW1lICs9IHRvU3RyaW5nKF9kYXRhLCBvZmZzZXQyLCBvZmZzZXQyICsgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDIrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZXMucHVzaChjdXJyX25hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDIrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyX2NvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vQWRqdXN0IGZvciA0Ynl0ZSBhbGlnbm1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgob2Zmc2V0MiAlIDQpID4gMCkgb2Zmc2V0MiA9ICg0IC0gKG9mZnNldDIgJSA0KSkgKyBvZmZzZXQyO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0MiArPSA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgY3Vycl9jb3VudCA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vQnVpbGQgdXAgbGlzdCBvZiBieXRlIGxlbmd0aHMgZm9yIHR5cGVzXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY3Vycl9jb3VudCA8IGNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuZ3Rocy5wdXNoKGRhdGEuZ2V0SW50MTYob2Zmc2V0MiwgQklHX0VORElBTikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDIgKz0gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyX2NvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vQWRqdXN0IGZvciA0Ynl0ZSBhbGlnbm1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgob2Zmc2V0MiAlIDQpID4gMCkgb2Zmc2V0MiA9ICg0IC0gKG9mZnNldDIgJSA0KSkgKyBvZmZzZXQyO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0MiArPSA0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL051bWJlciBvZiBzdHJ1Y3R1cmVzXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RydWN0dXJlX2NvdW50ID0gZGF0YS5nZXRJbnQzMihvZmZzZXQyLCBCSUdfRU5ESUFOKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDIgKz0gNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJfY291bnQgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvL0NyZWF0ZSBjb25zdHJ1Y3RvciBvYmplY3RzIGZyb20gbGlzdCBvZiBTRE5BIHN0cnVjdHNcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChjdXJyX2NvdW50IDwgc3RydWN0dXJlX2NvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN0cnVjdF9uYW1lID0gdHlwZXNbZGF0YS5nZXRJbnQxNihvZmZzZXQyLCBCSUdfRU5ESUFOKV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0MiArPSAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iaiA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ID0gZGF0YS5nZXRJbnQxNihvZmZzZXQyLCBCSUdfRU5ESUFOKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQyICs9IDI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vycl9jb3VudDIgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cnVjdF9uYW1lcy5wdXNoKHN0cnVjdF9uYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vRmlsbCBhbiBhcnJheSB3aXRoIG5hbWUsIHR5cGUsIGFuZCBsZW5ndGggZm9yIGVhY2ggU0ROQSBzdHJ1Y3QgcHJvcGVydHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoY3Vycl9jb3VudDIgPCBjb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmoucHVzaChuYW1lc1tkYXRhLmdldEludDE2KG9mZnNldDIgKyAyLCBCSUdfRU5ESUFOKV0sIHR5cGVzW2RhdGEuZ2V0SW50MTYob2Zmc2V0MiwgQklHX0VORElBTildLCBsZW5ndGhzW2RhdGEuZ2V0SW50MTYob2Zmc2V0MiwgQklHX0VORElBTildKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0MiArPSA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyX2NvdW50MisrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vQ3JlYXRlIGEgU0ROQSBjb25zdHJ1Y3RvciBieSBwYXNzaW5nIFt0eXBlLG5hbWUsbGVudGhdIGFycmF5IGFzIHNlY29uZCBhcmd1bWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfU0ROQV90ZW1wbGF0ZS5nZXRTRE5BU3RydWN0dXJlQ29uc3RydWN0b3Ioc3RydWN0X25hbWUsIG9iaik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vycl9jb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudF9TRE5BX3RlbXBsYXRlLlNETkFfU0VUID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfU0ROQV90ZW1wbGF0ZS5TRE5BX05BTUVTID0gc3RydWN0X25hbWVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0MiArPSBibG9ja19sZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL3BhcnNlIHRoZSByZXN0IG9mIHRoZSBkYXRhLCBzdGFydGluZyBiYWNrIGF0IHRoZSB0b3AuXG4gICAgICAgICAgICAvL1RPRE86IHR1cm4gaW50byBcIm9uLWRlbWFuZFwiIHBhcnNpbmcuXG5cbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKChvZmZzZXQgJSA0KSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gKDQgLSAob2Zmc2V0ICUgNCkpICsgb2Zmc2V0O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRhdGFfb2Zmc2V0ID0gb2Zmc2V0O1xuICAgICAgICAgICAgICAgIHNkbmFfaW5kZXggPSBkYXRhLmdldEludDMyKG9mZnNldCArIHBvaW50ZXJfc2l6ZSArIDgsIEJJR19FTkRJQU4pO1xuICAgICAgICAgICAgICAgIGxldCBjb2RlX3VpbnQgPSBkYXRhLmdldFVpbnQzMihvZmZzZXQsIEJJR19FTkRJQU4pO1xuICAgICAgICAgICAgICAgIG9mZnNldDIgPSBvZmZzZXQgKyAxNiArIChwb2ludGVyX3NpemUpO1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSBkYXRhLmdldEludDMyKG9mZnNldCArIDQsIHRydWUpICsgMTYgKyAocG9pbnRlcl9zaXplKTtcblxuICAgICAgICAgICAgICAgIGlmIChjb2RlX3VpbnQgPT09IEROQTEpOyAvL3NraXAgLSBhbHJlYWR5IHByb2Nlc3NlZCBhdCB0aGlzIHBvaW50ICAgIFxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvZGVfdWludCA9PT0gRU5EQikgYnJlYWs7IC8vZW5kIG9mIF9fYmxlbmRlcl9maWxlX18gZm91bmRcbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy9DcmVhdGUgYSBCbGVuZGVyIG9iamVjdCB1c2luZyBhIGNvbnN0cnVjdG9yIHRlbXBsYXRlIGZyb20gY3VycmVudF9TRE5BX3RlbXBsYXRlXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhX3N0YXJ0ID0gZGF0YV9vZmZzZXQgKyBwb2ludGVyX3NpemUgKyAxNjtcblxuICAgICAgICAgICAgICAgICAgICAvL0dldCBhIFNETkEgY29uc3RydWN0b3IgYnkgbmFtZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnN0cnVjdG9yID0gY3VycmVudF9TRE5BX3RlbXBsYXRlLmdldFNETkFTdHJ1Y3R1cmVDb25zdHJ1Y3RvcihjdXJyZW50X1NETkFfdGVtcGxhdGUuU0ROQV9OQU1FU1tzZG5hX2luZGV4XSk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNpemUgPSBkYXRhLmdldEludDMyKGRhdGFfb2Zmc2V0ICsgNCwgQklHX0VORElBTik7XG5cbiAgICAgICAgICAgICAgICAgICAgY291bnQgPSBkYXRhLmdldEludDMyKGRhdGFfb2Zmc2V0ICsgMTIgKyBwb2ludGVyX3NpemUsIEJJR19FTkRJQU4pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb3VudCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvYmogPSBuZXcgY29uc3RydWN0b3IoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGNvbnN0cnVjdG9yLnByb3RvdHlwZS5fbGVuZ3RoO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZGRyZXNzID0gRklMRS5nZXRQb2ludGVyKGRhdGFfb2Zmc2V0ICsgOCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG9iai5hZGRyZXNzID0gYWRkcmVzcyArIFwiXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG9iai5zZXREYXRhKGFkZHJlc3MsIGRhdGFfc3RhcnQsIGRhdGFfc3RhcnQgKyBzaXplLCBGSUxFKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvdW50ID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBhcnJheSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5LnB1c2gob2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciB1ID0gMTsgdSA8IGNvdW50OyB1KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqID0gbmV3IGNvbnN0cnVjdG9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iai5zZXREYXRhKGFkZHJlc3MsIGRhdGFfc3RhcnQgKyBsZW5ndGggKiB1LCBkYXRhX3N0YXJ0ICsgKGxlbmd0aCAqIHUpICsgbGVuZ3RoLCBGSUxFKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXkucHVzaChvYmopO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGSUxFLm1lbW9yeV9sb29rdXBbYWRkcmVzc10gPSBhcnJheTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRklMRS5tZW1vcnlfbG9va3VwW2FkZHJlc3NdID0gb2JqO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXR1cm5fb2JqZWN0O1xufSk7IiwiLypqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXHJcblxyXG5jb25zdCBjcmVhdGVNYXRlcmlhbCA9IHJlcXVpcmUoXCIuL21hdGVyaWFsLmpzXCIpO1xyXG5jb25zdCBjcmVhdGVUZXh0dXJlID0gcmVxdWlyZShcIi4vdGV4dHVyZS5qc1wiKTtcclxuY29uc3QgY3JlYXRlTWVzaCA9IHJlcXVpcmUoXCIuL21lc2guanNcIik7XHJcbmNvbnN0IGNyZWF0ZUxpZ2h0ID0gcmVxdWlyZShcIi4vbGlnaHQuanNcIik7XHJcblxyXG5mdW5jdGlvbiBsb2FkTW9kZWwodGhyZWVfc2NlbmUsIG1vZGVsX25hbWUsIGJsZW5kZXJfZmlsZSwgY2FjaGUpIHtcclxuXHR2YXIgbWF0cyA9IGJsZW5kZXJfbWVzaC5tYXQsXHJcblx0XHRtYXRlcmlhbHMgPSBbXTtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IG1hdHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdHZhciBtYXRlcmlhbCA9IGNyZWF0ZVRocmVlSlNNYXRlcmlhbChtYXRzW2ldKTtcclxuXHRcdG1hdGVyaWFscy5wdXNoKG1hdGVyaWFsKTtcclxuXHR9XHJcbn1cclxuXHJcbnZhciBibGVuZGVyX3R5cGVzID0ge1xyXG5cdG1lc2hfb2JqZWN0OiAxLFxyXG5cdGxhbXA6IDEwXHJcbn07XHJcblxyXG5mdW5jdGlvbiBsb2FkU2NlbmUodGhyZWVfc2NlbmUsIGJsZW5kZXJfZmlsZSwgY2FjaGUpIHtcclxuXHQvL2J1aWxkIG9iamVjdCBmcm9tIGJsZW5kZXIgbWVzaCBvYmplY3RcclxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGJsZW5kZXJfZmlsZS5vYmplY3RzLk9iamVjdC5sZW5ndGg7IGkrKykge1xyXG5cclxuXHRcdGxldCBvYmogPSBibGVuZGVyX2ZpbGUub2JqZWN0cy5PYmplY3RbaV07XHJcblxyXG5cdFx0Ly9Mb2FkIExpZ2h0c1xyXG5cclxuXHRcdGlmIChvYmoudHlwZSA9PSBibGVuZGVyX3R5cGVzLmxhbXApIHtcclxuXHJcblx0XHRcdGxldCBsaWdodCA9IGNyZWF0ZUxpZ2h0KG9iaiwgYmxlbmRlcl9maWxlKTtcclxuXHJcblx0XHRcdHRocmVlX3NjZW5lLmFkZChsaWdodCk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9Mb2FkIE1lc2hlc1xyXG5cclxuXHRcdGlmIChvYmoudHlwZSA9PSBibGVuZGVyX3R5cGVzLm1lc2hfb2JqZWN0KSB7XHJcblx0XHRcdGlmIChvYmouZGF0YSkge1xyXG5cdFx0XHRcdC8vZ2V0IHRoZSBtZXNoIFxyXG5cdFx0XHRcdHZhciBidWZmZXJlZF9nZW9tZXRyeSA9IGNyZWF0ZU1lc2gob2JqLmRhdGEsIFswLCAwLCAwXSk7XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHR2YXIgYmxlbmRfbWF0ZXJpYWwgPSBvYmouZGF0YS5tYXRbMF07XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYoYmxlbmRfbWF0ZXJpYWwpe1xyXG5cdFx0XHRcdFx0dmFyIG1hdGVyaWFsID0gY3JlYXRlTWF0ZXJpYWwoYmxlbmRfbWF0ZXJpYWwpO1xyXG5cdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0Ly9jcmVhdGUgZ2VuZXJpYyBtYXRlcmlhbFxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Ly92YXIgZ2VvbWV0cnkgPSBjcmVhdGVUaHJlZUpTR2VvbWV0cnkob2JqLmRhdGEsIFswLCAwLCAwXSk7XHJcblx0XHRcdFx0Ly8vKlxyXG5cdFx0XHRcdC8vY3JlYXRlIGEgdHJhbnNmb3JtIGZyb20gdGhlIG1lc2ggb2JqZWN0XHJcblx0XHRcdFx0dmFyIG1lc2ggPSBuZXcgVEhSRUUuTWVzaChidWZmZXJlZF9nZW9tZXRyeSwgbWF0ZXJpYWwpO1xyXG5cclxuXHRcdFx0XHRtZXNoLmNhc3RTaGFkb3cgPSB0cnVlO1xyXG5cdFx0XHRcdG1lc2gucmVjZWl2ZVNoYWRvdyA9IHRydWU7XHJcblxyXG5cdFx0XHRcdHRocmVlX3NjZW5lLmFkZChtZXNoKTtcclxuXHJcblx0XHRcdFx0bWVzaC5yb3RhdGVaKG9iai5yb3RbMl0pO1xyXG5cdFx0XHRcdG1lc2gucm90YXRlWShvYmoucm90WzFdKTtcclxuXHRcdFx0XHRtZXNoLnJvdGF0ZVgob2JqLnJvdFswXSk7XHJcblx0XHRcdFx0bWVzaC5zY2FsZS5mcm9tQXJyYXkob2JqLnNpemUsIDApO1xyXG5cdFx0XHRcdG1lc2gucG9zaXRpb24uZnJvbUFycmF5KFtvYmoubG9jWzBdLCAob2JqLmxvY1syXSksICgtb2JqLmxvY1sxXSldLCAwKTtcclxuXHRcdFx0XHQvLyovXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGJsZW5kZXJfZmlsZSkgPT4ge1xyXG5cclxuXHRpZiAoIVRIUkVFKSB7XHJcblx0XHRjb25zb2xlLndhcm4oXCJObyBUaHJlZUpTIG9iamVjdCBkZXRlY3RlZFwiKTtcclxuXHRcdHJldHVybiB7fTtcclxuXHR9XHJcblxyXG5cdHZhciBjYWNoZSA9IHt9O1xyXG5cclxuXHRyZXR1cm4ge1xyXG5cdFx0bG9hZFNjZW5lOiAodGhyZWVfc2NlbmUpID0+IGxvYWRTY2VuZSh0aHJlZV9zY2VuZSwgYmxlbmRlcl9maWxlLCBjYWNoZSksXHJcblx0XHRsb2FkTW9kZWw6IChtb2RlbF9uYW1lKSA9PiBsb2FkTW9kZWwobW9kZWxfbmFtZSwgYmxlbmRlcl9maWxlLCBjYWNoZSlcclxuXHR9O1xyXG59OyIsIi8qanNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5cclxudmFyIGJsZW5kZXJfbGlnaHRfdHlwZXMgPSB7XHJcblx0cG9pbnQ6IDAsXHJcblx0c3VuOiAxLFxyXG5cdHNwb3Q6IDAsXHJcblx0aGVtaTogMCxcclxuXHRhcmVhOiAwXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZVRocmVlSlNMYW1wKGJsZW5kX2xhbXApIHtcclxuXHJcblx0bGV0IGxkYXRhID0gYmxlbmRfbGFtcC5kYXRhO1xyXG5cclxuXHRsZXQgcG9zX2FycmF5ID0gW2JsZW5kX2xhbXAubG9jWzBdLCBibGVuZF9sYW1wLmxvY1syXSwgLWJsZW5kX2xhbXAubG9jWzFdXTtcclxuXHJcblx0bGV0IGNvbG9yID0gKChsZGF0YS5yICogMjU1KSA8PCAxNikgfCAoKGxkYXRhLmcgKiAyNTUpIDw8IDgpIHwgKChsZGF0YS5iICogMjU1KSA8PCAwKTtcclxuXHRsZXQgaW50ZXNpdHkgPSBsZGF0YS5lbmVyZ3k7XHJcblx0bGV0IGRpc3RhbmNlID0gMDtcclxuXHJcblx0dmFyIHRocmVlX2xpZ2h0ID0gbnVsbDtcclxuXHJcblx0c3dpdGNoIChsZGF0YS50eXBlKSB7XHJcblx0XHRjYXNlIGJsZW5kZXJfbGlnaHRfdHlwZXMucG9pbnQ6XHJcblx0XHRcdHZhciB0aHJlZV9saWdodCA9IG5ldyBUSFJFRS5Qb2ludExpZ2h0KGNvbG9yLCBpbnRlc2l0eSwgZGlzdGFuY2UpO1xyXG5cdFx0XHR0aHJlZV9saWdodC5wb3NpdGlvbi5mcm9tQXJyYXkocG9zX2FycmF5LCAwKTtcclxuXHRcdFx0dGhyZWVfbGlnaHQuY2FzdFNoYWRvdyA9IHRydWU7XHJcblx0XHRcdGJyZWFrO1xyXG5cdFx0Y2FzZSBibGVuZGVyX2xpZ2h0X3R5cGVzLnN1bjpcclxuXHRcdFx0dmFyIHRocmVlX2xpZ2h0ID0gbmV3IFRIUkVFLlBvaW50TGlnaHQoY29sb3IsIGludGVzaXR5LCBkaXN0YW5jZSk7XHJcblx0XHRcdHRocmVlX2xpZ2h0LnBvc2l0aW9uLmZyb21BcnJheShwb3NfYXJyYXksIDApO1xyXG5cdFx0XHR0aHJlZV9saWdodC5jYXN0U2hhZG93ID0gdHJ1ZTtcclxuXHRcdFx0dGhyZWVfbGlnaHQuc2hhZG93Lm1hcFNpemUud2lkdGggPSAxMDI0O1xyXG5cdFx0XHR0aHJlZV9saWdodC5zaGFkb3cubWFwU2l6ZS5oZWlnaHQgPSAxMDI0O1xyXG5cdFx0XHR0aHJlZV9saWdodC5zaGFkb3cuY2FtZXJhLm5lYXIgPSAwLjAxO1xyXG5cdFx0XHR0aHJlZV9saWdodC5zaGFkb3cuY2FtZXJhLmZhciA9IDUwMDtcclxuXHRcdFx0YnJlYWs7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gdGhyZWVfbGlnaHQ7XHJcbn0iLCIvKmpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKCgpID0+IHtcclxuICAgIGNvbnN0IGNyZWF0ZVRleHR1cmUgPSByZXF1aXJlKFwiLi90ZXh0dXJlLmpzXCIpO1xyXG5cclxuICAgIHZhciB0ZXh0dXJlX21hcHBpbmdzID0ge1xyXG4gICAgICAgIGRpZmZfY29sb3I6IDEsXHJcbiAgICAgICAgbm9ybWFsOiAyLFxyXG4gICAgICAgIG1pcnJvcjogOCxcclxuICAgICAgICBkaWZmX2ludGVuc2l0eTogMTYsXHJcbiAgICAgICAgc3BlY19pbnRlbnNpdHk6IDMyLFxyXG4gICAgICAgIGVtaXQ6IDMyLFxyXG4gICAgICAgIGFscGhhOiAxMjgsXHJcbiAgICAgICAgc3BlY19oYXJkbmVzczogMjU2LFxyXG4gICAgICAgIHJheV9taXJyb3I6IDUxMixcclxuICAgICAgICB0cmFuc2x1Y2VuY3k6IDEwMjQsXHJcbiAgICAgICAgYW1iaWVudDogMjA0OCxcclxuICAgICAgICBkaXNwbGFjZW1lbnQ6IDQwOTYsXHJcbiAgICAgICAgd2FycDogODE5MlxyXG4gICAgfTtcclxuXHJcbiAgICBsZXQgYmxlbmRlcl9zcGVjdWxhcl90eXBlcyA9IHtcclxuICAgICAgICBjb29rdG9ycjogMCxcclxuICAgICAgICBwaG9uZzogMSxcclxuICAgICAgICBibGlubjogMixcclxuICAgICAgICB0b29uOiAzLFxyXG4gICAgICAgIHdhcmRpc286IDRcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gYXBwbHlDb2xvck1hcHBpbmcoYmxlbmRlcl90ZXh0dXJlLCB0aHJlZV90ZXh0dXJlLCBtYXRlcmlhbCkge1xyXG4gICAgICAgIGlmIChibGVuZGVyX3RleHR1cmUubWFwdG8gJiB0ZXh0dXJlX21hcHBpbmdzLmRpZmZfY29sb3IpIHtcclxuICAgICAgICAgICAgbWF0ZXJpYWwubWFwID0gdGhyZWVfdGV4dHVyZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYXBwbHlTcGVjTWFwcGluZyhibGVuZGVyX3RleHR1cmUsIHRocmVlX3RleHR1cmUsIG1hdGVyaWFsKSB7XHJcbiAgICAgICAgaWYgKGJsZW5kZXJfdGV4dHVyZS5tYXB0byAmIHRleHR1cmVfbWFwcGluZ3Muc3BlY19jb2xvciAmJiBtYXRlcmlhbC50eXBlICE9IFwiTWVzaFN0YW5kYXJkTWF0ZXJpYWxcIikge1xyXG4gICAgICAgICAgICBtYXRlcmlhbC5zcGVjdWxhck1hcCA9IHRocmVlX3RleHR1cmU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYmxlbmRlcl90ZXh0dXJlLm1hcHRvICYgdGV4dHVyZV9tYXBwaW5ncy5zcGVjX2ludGVuc2l0eSAmJiBtYXRlcmlhbC50eXBlICE9IFwiTWVzaFN0YW5kYXJkTWF0ZXJpYWxcIikge1xyXG4gICAgICAgICAgICBtYXRlcmlhbC5yb3VnaG5lc3NNYXAgPSB0aHJlZV90ZXh0dXJlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcHBseUFscGhhTWFwcGluZyhibGVuZGVyX3RleHR1cmUsIHRocmVlX3RleHR1cmUsIG1hdGVyaWFsKSB7XHJcbiAgICAgICAgaWYgKGJsZW5kZXJfdGV4dHVyZS5tYXB0byAmIHRleHR1cmVfbWFwcGluZ3MuYWxwaGEpIHtcclxuICAgICAgICAgICAgbWF0ZXJpYWwuYWxwaGFNYXAgPSB0aHJlZV90ZXh0dXJlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcHBseU5vcm1hbE1hcHBpbmcoYmxlbmRlcl90ZXh0dXJlLCB0aHJlZV90ZXh0dXJlLCBtYXRlcmlhbCkge1xyXG4gICAgICAgIGlmIChibGVuZGVyX3RleHR1cmUubWFwdG8gJiB0ZXh0dXJlX21hcHBpbmdzLm5vcm1hbCkge1xyXG4gICAgICAgICAgICBtYXRlcmlhbC5ub3JtYWxNYXAgPSB0aHJlZV90ZXh0dXJlO1xyXG4gICAgICAgICAgICBtYXRlcmlhbC5ub3JtYWxTY2FsZSA9IHtcclxuICAgICAgICAgICAgICAgIHg6IGJsZW5kZXJfdGV4dHVyZS5ub3JmYWMsXHJcbiAgICAgICAgICAgICAgICB5OiBibGVuZGVyX3RleHR1cmUubm9yZmFjXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFwcGx5TWlycm9yTWFwcGluZyhibGVuZGVyX3RleHR1cmUsIHRocmVlX3RleHR1cmUsIG1hdGVyaWFsKSB7XHJcbiAgICAgICAgaWYgKGJsZW5kZXJfdGV4dHVyZS5tYXB0byAmIHRleHR1cmVfbWFwcGluZ3MubWlycm9yKSB7XHJcbiAgICAgICAgICAgIG1hdGVyaWFsLmVudk1hcCA9IHRocmVlX3RleHR1cmU7XHJcbiAgICAgICAgICAgIG1hdGVyaWFsLmVudk1hcEludGVuc2l0eSA9IGJsZW5kZXJfdGV4dHVyZS5taXJyZmFjO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgYmxlbmRlcl90ZXh0dXJlX2Nvb3JkaW5hdGVzID0ge1xyXG4gICAgICAgIEdFTkVSQVRFRCA6IDEsXHJcbiAgICAgICAgUkVGTEVDVElPTiA6IDIsXHJcbiAgICAgICAgTk9STUFMOjQsXHJcbiAgICAgICAgR0xPQkFMIDogOCxcclxuICAgICAgICBVViA6IDE2LFxyXG4gICAgICAgIE9CSkVDVCA6IDMyLFxyXG4gICAgICAgIFdJTkRPVzogMTAyNCxcclxuICAgICAgICBUQU5HRU5UOjQwOTYsXHJcbiAgICAgICAgUEFSVElDTEU6IDgxOTIsXHJcbiAgICAgICAgU1RSRVNTOjE2Mzg0XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGJsZW5kZXJfdGV4dHVyZV9tYXBwaW5nID0ge1xyXG4gICAgICAgIEZMQVQgOiAwLFxyXG4gICAgICAgIENVQkUgOiAxLFxyXG4gICAgICAgIFRVQkUgOiAyLFxyXG4gICAgICAgIFNQSEVSRSA6IDNcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcHBseVRleHR1cmUoYmxlbmRlcl90ZXh0dXJlLCBtYXRlcmlhbCkge1xyXG4gICAgICAgIC8vZXh0cmFjdCBibGVuZGVyX3RleHR1cmUgZGF0YS4gVXNlIE9ubHkgaWYgaW1hZ2UgaGFzIGJlZW4gc3VwcGxpZWQuXHJcbiAgICAgICAgaWYgKGJsZW5kZXJfdGV4dHVyZSAmJiBibGVuZGVyX3RleHR1cmUudGV4ICYmIGJsZW5kZXJfdGV4dHVyZS50ZXguaW1hKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgdGhyZWVfdGV4dHVyZSA9IGNyZWF0ZVRleHR1cmUoYmxlbmRlcl90ZXh0dXJlLnRleC5pbWEpO1xyXG5cclxuICAgICAgICAgICAgaWYoYmxlbmRlcl90ZXh0dXJlLnRleGNvID09IGJsZW5kZXJfdGV4dHVyZV9jb29yZGluYXRlcy5SRUZMRUNUSU9OKXtcclxuICAgICAgICAgICAgICAgIHN3aXRjaChibGVuZGVyX3RleHR1cmUubWFwcGluZyl7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBibGVuZGVyX3RleHR1cmVfbWFwcGluZy5GTEFUOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJlZV90ZXh0dXJlLm1hcHBpbmcgPSBUSFJFRS5FcXVpcmVjdGFuZ3VsYXJSZWZsZWN0aW9uTWFwcGluZztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIGJsZW5kZXJfdGV4dHVyZV9tYXBwaW5nLlNQSEVSRTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyZWVfdGV4dHVyZS5tYXBwaW5nID0gVEhSRUUuU3BoZXJpY2FsUmVmbGVjdGlvbk1hcHBpbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgLy90aHJlZV90ZXh0dXJlLm1hcHBpbmcgPSBUSFJFRS5FcXVpcmVjdGFuZ3VsYXJSZWZyYWN0aW9uTWFwcGluZztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgYXBwbHlDb2xvck1hcHBpbmcoYmxlbmRlcl90ZXh0dXJlLCB0aHJlZV90ZXh0dXJlLCBtYXRlcmlhbCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBhcHBseVNwZWNNYXBwaW5nKGJsZW5kZXJfdGV4dHVyZSwgdGhyZWVfdGV4dHVyZSwgbWF0ZXJpYWwpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgYXBwbHlBbHBoYU1hcHBpbmcoYmxlbmRlcl90ZXh0dXJlLCB0aHJlZV90ZXh0dXJlLCBtYXRlcmlhbCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBhcHBseU5vcm1hbE1hcHBpbmcoYmxlbmRlcl90ZXh0dXJlLCB0aHJlZV90ZXh0dXJlLCBtYXRlcmlhbCk7XHJcblxyXG4gICAgICAgICAgICBhcHBseU1pcnJvck1hcHBpbmcoYmxlbmRlcl90ZXh0dXJlLCB0aHJlZV90ZXh0dXJlLCBtYXRlcmlhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbiBjcmVhdGVUaHJlZUpTTWF0ZXJpYWwoYmxlbmRfbWF0KSB7XHJcblxyXG4gICAgICAgIHZhciBtYXRlcmlhbCA9IG51bGw7XHJcblxyXG4gICAgICAgIHZhciB0ZXh0dXJlcyA9IGJsZW5kX21hdC5tdGV4O1xyXG5cclxuICAgICAgICBzd2l0Y2ggKGJsZW5kX21hdC5zcGVjX3NoYWRlcikge1xyXG4gICAgICAgICAgICBjYXNlIGJsZW5kZXJfc3BlY3VsYXJfdHlwZXMubGFtYmVydDpcclxuICAgICAgICAgICAgICAgIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwoKTtcclxuICAgICAgICAgICAgICAgIG1hdGVyaWFsLmNvbG9yLnNldFJHQihibGVuZF9tYXQuciwgYmxlbmRfbWF0LmcsIGJsZW5kX21hdC5iKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIGJsZW5kZXJfc3BlY3VsYXJfdHlwZXMuYmxpbm46XHJcbiAgICAgICAgICAgIGNhc2UgYmxlbmRlcl9zcGVjdWxhcl90eXBlcy5waG9uZzpcclxuXHJcbiAgICAgICAgICAgICAgICBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoU3RhbmRhcmRNYXRlcmlhbCgpO1xyXG4gICAgICAgICAgICAgICAgbWF0ZXJpYWwuY29sb3Iuc2V0UkdCKGJsZW5kX21hdC5yLCBibGVuZF9tYXQuZywgYmxlbmRfbWF0LmIpO1xyXG4gICAgICAgICAgICAgICAgLy9tYXRlcmlhbC5zcGVjdWxhci5zZXRSR0IoYmxlbmRfbWF0LnNwZWNyLCBibGVuZF9tYXQuc3BlY2csIGJsZW5kX21hdC5zcGVjYik7XHJcbiAgICAgICAgICAgICAgICBtYXRlcmlhbC5yb3VnaG5lc3MgPSAoMSAtIChibGVuZF9tYXQuaGFyIC8gNTEyKSk7XHJcbiAgICAgICAgICAgICAgICBtYXRlcmlhbC5tZXRhbG5lc3MgPSAxIC0gYmxlbmRfbWF0LnJlZjtcclxuICAgICAgICAgICAgICAgIGlmKGJsZW5kX21hdC5hbHBoYSA8IDAuOTgpe1xyXG4gICAgICAgICAgICAgICAgICAgIG1hdGVyaWFsLnRyYW5zcGFyZW50ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBtYXRlcmlhbC5vcGFjaXR5ID0gYmxlbmRfbWF0LmFscGhhO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGJsZW5kX21hdCwgbWF0ZXJpYWwpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBibGVuZGVyX3NwZWN1bGFyX3R5cGVzLndhcmRpc286XHJcbiAgICAgICAgICAgIGNhc2UgYmxlbmRlcl9zcGVjdWxhcl90eXBlcy5jb29rdG9ycjpcclxuICAgICAgICAgICAgICAgIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKCk7XHJcbiAgICAgICAgICAgICAgICBtYXRlcmlhbC5jb2xvci5zZXRSR0IoYmxlbmRfbWF0LnIsIGJsZW5kX21hdC5nLCBibGVuZF9tYXQuYik7XHJcbiAgICAgICAgICAgICAgICBtYXRlcmlhbC5zcGVjdWxhci5zZXRSR0IoYmxlbmRfbWF0LnNwZWNyLCBibGVuZF9tYXQuc3BlY2csIGJsZW5kX21hdC5zcGVjYik7XHJcbiAgICAgICAgICAgICAgICBtYXRlcmlhbC5zaGluaW5lc3MgPSBibGVuZF9tYXQuaGFyIC8gNTEyO1xyXG4gICAgICAgICAgICAgICAgbWF0ZXJpYWwucmVmbGVjdGl2aXR5ID0gYmxlbmRfbWF0LnJlZiAqIDEwMDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCgpO1xyXG4gICAgICAgICAgICAgICAgbWF0ZXJpYWwuY29sb3Iuc2V0UkdCKGJsZW5kX21hdC5yLCBibGVuZF9tYXQuZywgYmxlbmRfbWF0LmIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgYXQgPSAodGV4dHVyZSkgPT4gYXBwbHlUZXh0dXJlKHRleHR1cmUsIG1hdGVyaWFsKTtcclxuXHJcblxyXG4gICAgICAgIGlmICh0ZXh0dXJlcyAmJiB0ZXh0dXJlcy5sZW5ndGgpIHRleHR1cmVzLm1hcChhdCk7XHJcblxyXG4gICAgICAgIHJldHVybiBtYXRlcmlhbDtcclxuICAgIH07XHJcbn0pKCk7IiwiLypqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlVGhyZWVKU0J1ZmZlckdlb21ldHJ5KGJsZW5kZXJfbWVzaCwgb3JpZ2luKSB7XHJcbiAgICAvL2dldCBtYXRlcmlhbHNcclxuICAgIGxldCBwaWNrX21hdGVyaWFsID0gMCxcclxuICAgICAgICBtZXNoID0gYmxlbmRlcl9tZXNoLFxyXG4gICAgICAgIGZhY2VzID0gbWVzaC5tcG9seSxcclxuICAgICAgICBsb29wcyA9IG1lc2gubWxvb3AsXHJcbiAgICAgICAgVVYgPSBtZXNoLm1sb29wdXYsXHJcbiAgICAgICAgdmVydHMgPSBtZXNoLm12ZXJ0O1xyXG5cclxuICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5CdWZmZXJHZW9tZXRyeSgpO1xyXG5cclxuICAgIGlmICghZmFjZXMpIHJldHVybiBnZW9tZXRyeTtcclxuXHJcbiAgICB2YXIgaW5kZXhfY291bnQgPSAwO1xyXG5cclxuICAgIC8vcHJlY2FsY3VsYXRlIHRoZSBzaXplIG9mIHRoZSBhcnJheSBuZWVkZWQgZm9yIGZhY2VzXHJcbiAgICB2YXIgZmFjZV9pbmRpY2VfY291bnQgPSAwO1xyXG4gICAgdmFyIGZhY2VfaW5kaWNlX2NvdW50YSA9IDA7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmYWNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBmYWNlID0gZmFjZXNbaV0gfHwgZmFjZXM7XHJcbiAgICAgICAgdmFyIGxlbiA9IGZhY2UudG90bG9vcDtcclxuICAgICAgICB2YXIgaW5kZXhpID0gMTtcclxuXHJcbiAgICAgICAgZmFjZV9pbmRpY2VfY291bnRhICs9IChsZW4gKiAyIC8gMykgfCAwO1xyXG5cclxuICAgICAgICB3aGlsZSAoaW5kZXhpIDwgbGVuKSB7XHJcbiAgICAgICAgICAgIGZhY2VfaW5kaWNlX2NvdW50ICs9IDM7XHJcbiAgICAgICAgICAgIGluZGV4aSArPSAyO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL2V4dHJhY3QgZmFjZSBpbmZvIGFuZCBkdW1wIGludG8gYXJyYXkgYnVmZmVyO1xyXG4gICAgdmFyIGZhY2VfYnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KGZhY2VfaW5kaWNlX2NvdW50KTtcclxuICAgIHZhciB1dl9idWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KGZhY2VfaW5kaWNlX2NvdW50ICogMik7XHJcbiAgICB2YXIgbm9ybWFsX2J1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkoZmFjZV9pbmRpY2VfY291bnQgKiAzKTtcclxuICAgIHZhciB2ZXJ0c19hcnJheV9idWZmID0gbmV3IEZsb2F0MzJBcnJheShmYWNlX2luZGljZV9jb3VudCAqIDMpO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmFjZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgZmFjZSA9IGZhY2VzW2ldIHx8IGZhY2VzO1xyXG4gICAgICAgIHZhciBsZW4gPSBmYWNlLnRvdGxvb3A7XHJcbiAgICAgICAgdmFyIHN0YXJ0ID0gZmFjZS5sb29wc3RhcnQ7XHJcbiAgICAgICAgdmFyIGluZGV4aSA9IDE7XHJcbiAgICAgICAgdmFyIG9mZnNldCA9IDA7XHJcblxyXG4gICAgICAgIHdoaWxlIChpbmRleGkgPCBsZW4pIHtcclxuICAgICAgICAgICAgdmFyIGZhY2Vfbm9ybWFscyA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgZmFjZV9pbmRleF9hcnJheSA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgZmFjZV91dnMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGxldCBpbmRleCA9IDA7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBsID0gMDsgbCA8IDM7IGwrKykge1xyXG4gICAgICAgICAgICAgICAgLy9QZXIgVmVydGljZSBcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoKGluZGV4aSAtIDEpICsgbCA8IGxlbikge1xyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gc3RhcnQgKyAoaW5kZXhpIC0gMSkgKyBsO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IHN0YXJ0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciB2ID0gbG9vcHNbaW5kZXhdLnY7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmVydCA9IHZlcnRzW3ZdO1xyXG4gICAgICAgICAgICAgICAgZmFjZV9idWZmZXJbaW5kZXhfY291bnRdID0gaW5kZXhfY291bnQ7XHJcbiAgICAgICAgICAgICAgICAvL2dldCBub3JtYWxzLCB3aGljaCBhcmUgMTZieXRlIGludHMsIGFuZCBub3JtIHRoZW0gYmFjayBpbnRvIGZsb2F0cy5cclxuXHJcbiAgICAgICAgICAgICAgICB2ZXJ0c19hcnJheV9idWZmW2luZGV4X2NvdW50ICogMyArIDBdID0gdmVydC5jb1swXSArIG9yaWdpblswXTtcclxuICAgICAgICAgICAgICAgIHZlcnRzX2FycmF5X2J1ZmZbaW5kZXhfY291bnQgKiAzICsgMV0gPSB2ZXJ0LmNvWzJdICsgb3JpZ2luWzJdO1xyXG4gICAgICAgICAgICAgICAgdmVydHNfYXJyYXlfYnVmZltpbmRleF9jb3VudCAqIDMgKyAyXSA9IC12ZXJ0LmNvWzFdICsgLW9yaWdpblsxXTtcclxuXHJcbiAgICAgICAgICAgICAgICBub3JtYWxfYnVmZmVyW2luZGV4X2NvdW50ICogMyArIDBdID0gdmVydC5ub1swXTtcclxuICAgICAgICAgICAgICAgIG5vcm1hbF9idWZmZXJbaW5kZXhfY291bnQgKiAzICsgMV0gPSB2ZXJ0Lm5vWzJdO1xyXG4gICAgICAgICAgICAgICAgbm9ybWFsX2J1ZmZlcltpbmRleF9jb3VudCAqIDMgKyAyXSA9ICgtdmVydC5ub1sxXSk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChVVikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB1diA9IFVWW2luZGV4XS51djtcclxuICAgICAgICAgICAgICAgICAgICB1dl9idWZmZXJbaW5kZXhfY291bnQgKiAyICsgMF0gPSB1dlswXTtcclxuICAgICAgICAgICAgICAgICAgICB1dl9idWZmZXJbaW5kZXhfY291bnQgKiAyICsgMV0gPSB1dlsxXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpbmRleF9jb3VudCsrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpbmRleGkgKz0gMjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2VvbWV0cnkuYWRkQXR0cmlidXRlKCdwb3NpdGlvbicsIG5ldyBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUodmVydHNfYXJyYXlfYnVmZiwgMykpO1xyXG4gICAgZ2VvbWV0cnkuc2V0SW5kZXgobmV3IFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZShmYWNlX2J1ZmZlciwgMSkpO1xyXG4gICAgZ2VvbWV0cnkuYWRkQXR0cmlidXRlKCdub3JtYWwnLCBuZXcgVEhSRUUuQnVmZmVyQXR0cmlidXRlKG5vcm1hbF9idWZmZXIsIDMpKTtcclxuICAgIGdlb21ldHJ5LmFkZEF0dHJpYnV0ZSgndXYnLCBuZXcgVEhSRUUuQnVmZmVyQXR0cmlidXRlKHV2X2J1ZmZlciwgMikpO1xyXG4gICAgLy9nZW9tZXRyeS5ibGVuZF9tYXQgPSBtYXRlcmlhbHNbcGlja19tYXRlcmlhbF07XHJcblxyXG4gICAgcmV0dXJuIGdlb21ldHJ5O1xyXG59O1xyXG5cclxuZnVuY3Rpb24gY3JlYXRlVGhyZWVKU0dlb21ldHJ5KGJsZW5kZXJfbWVzaCwgb3JpZ2luKSB7XHJcbiAgICAvL2dldCBtYXRlcmlhbHNcclxuICAgIHZhciBtYXRzID0gYmxlbmRlcl9tZXNoLm1hdCxcclxuICAgICAgICBtYXRlcmlhbHMgPSBbXTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWF0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBtYXRlcmlhbCA9IGNyZWF0ZVRocmVlSlNNYXRlcmlhbChtYXRzW2ldKTtcclxuICAgICAgICBtYXRlcmlhbHMucHVzaChtYXRlcmlhbCk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHBpY2tfbWF0ZXJpYWwgPSAwLFxyXG4gICAgICAgIG1lc2ggPSBibGVuZGVyX21lc2gsXHJcbiAgICAgICAgZmFjZXMgPSBtZXNoLm1wb2x5LFxyXG4gICAgICAgIGxvb3BzID0gbWVzaC5tbG9vcCxcclxuICAgICAgICBVViA9IG1lc2gubWxvb3B1dixcclxuICAgICAgICB2ZXJ0cyA9IG1lc2gubXZlcnQsXHJcbiAgICAgICAgdmVydF9hcnJheSA9IFtdLFxyXG4gICAgICAgIGZhY2VfYXJyYXkgPSBbXSxcclxuICAgICAgICB1dl9hcnJheSA9IFtdLFxyXG4gICAgICAgIG5vcm1hbF9hcnJheSA9IFtdO1xyXG5cclxuICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xyXG5cclxuICAgIGlmICghZmFjZXMpIHJldHVybiBnZW9tZXRyeTtcclxuXHJcblxyXG4gICAgdmFyIGluZGV4X2NvdW50ID0gMDtcclxuXHJcbiAgICBsZXQgdmVydHNfYXJyYXlfYnVmZiA9IG5ldyBGbG9hdDMyQXJyYXkodmVydHMubGVuZ3RoICogMyk7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZXJ0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGxldCB2ZXJ0ID0gdmVydHNbaV07XHJcbiAgICAgICAgdmVydF9hcnJheS5wdXNoKG5ldyBUSFJFRS5WZWN0b3IzKHZlcnQuY29bMF0gKyBvcmlnaW5bMF0sIHZlcnQuY29bMl0gKyBvcmlnaW5bMl0sIC12ZXJ0LmNvWzFdIC0gb3JpZ2luWzFdKSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmYWNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBmYWNlID0gZmFjZXNbaV0gfHwgZmFjZXM7XHJcbiAgICAgICAgdmFyIGxlbiA9IGZhY2UudG90bG9vcDtcclxuICAgICAgICB2YXIgc3RhcnQgPSBmYWNlLmxvb3BzdGFydDtcclxuICAgICAgICB2YXIgaW5kZXhpID0gMTtcclxuXHJcbiAgICAgICAgcGlja19tYXRlcmlhbCA9IGZhY2UubWF0X25yO1xyXG5cclxuICAgICAgICB3aGlsZSAoaW5kZXhpIDwgbGVuKSB7XHJcbiAgICAgICAgICAgIHZhciBmYWNlX25vcm1hbHMgPSBbXTtcclxuICAgICAgICAgICAgdmFyIGZhY2VfaW5kZXhfYXJyYXkgPSBbXTtcclxuICAgICAgICAgICAgdmFyIGZhY2VfdXZzID0gW107XHJcblxyXG4gICAgICAgICAgICBsZXQgaW5kZXggPSAwO1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgbCA9IDA7IGwgPCAzOyBsKyspIHtcclxuICAgICAgICAgICAgICAgIC8vUGVyIFZlcnRpY2UgXHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKChpbmRleGkgLSAxKSArIGwgPCBsZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IHN0YXJ0ICsgKGluZGV4aSAtIDEpICsgbDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBzdGFydDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdiA9IGxvb3BzW2luZGV4XS52O1xyXG4gICAgICAgICAgICAgICAgdmFyIHZlcnQgPSB2ZXJ0c1t2XTtcclxuXHJcbiAgICAgICAgICAgICAgICBmYWNlX2luZGV4X2FycmF5LnB1c2godik7XHJcblxyXG4gICAgICAgICAgICAgICAgaW5kZXhfY291bnQrKztcclxuXHJcbiAgICAgICAgICAgICAgICAvL2dldCBub3JtYWxzLCB3aGljaCBhcmUgMTZieXRlIGludHMsIGFuZCBub3JtIHRoZW0gYmFjayBpbnRvIGZsb2F0cy5cclxuXHJcbiAgICAgICAgICAgICAgICB2YXJcclxuICAgICAgICAgICAgICAgICAgICBuMSA9IHZlcnQubm9bMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgbjIgPSB2ZXJ0Lm5vWzJdLFxyXG4gICAgICAgICAgICAgICAgICAgIG4zID0gLXZlcnQubm9bMV07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG5sID0gMTtcclxuXHJcbiAgICAgICAgICAgICAgICBNYXRoLnNxcnQoKG4xICogbjEpICsgKG4yICogbjIpICsgKG4zICogbjMpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBmYWNlX25vcm1hbHMucHVzaChuZXcgVEhSRUUuVmVjdG9yMyhuMSAvIG5sLCBuMiAvIG5sLCBuMyAvIG5sKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKFVWKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHV2ID0gVVZbaW5kZXhdLnV2O1xyXG4gICAgICAgICAgICAgICAgICAgIGZhY2VfdXZzLnB1c2gobmV3IFRIUkVFLlZlY3RvcjIodXZbMF0sIHV2WzFdKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdXZfYXJyYXkucHVzaChmYWNlX3V2cyk7XHJcbiAgICAgICAgICAgIGZhY2VfYXJyYXkucHVzaChuZXcgVEhSRUUuRmFjZTMoXHJcbiAgICAgICAgICAgICAgICBmYWNlX2luZGV4X2FycmF5WzBdLCBmYWNlX2luZGV4X2FycmF5WzFdLCBmYWNlX2luZGV4X2FycmF5WzJdLFxyXG4gICAgICAgICAgICAgICAgZmFjZV9ub3JtYWxzXHJcbiAgICAgICAgICAgICkpO1xyXG5cclxuICAgICAgICAgICAgaW5kZXhpICs9IDI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZ2VvbWV0cnkuYmxlbmRfbWF0ID0gbWF0ZXJpYWxzW3BpY2tfbWF0ZXJpYWxdO1xyXG4gICAgZ2VvbWV0cnkudmVydGljZXMgPSB2ZXJ0X2FycmF5O1xyXG4gICAgZ2VvbWV0cnkuZmFjZXMgPSBmYWNlX2FycmF5O1xyXG4gICAgaWYgKHV2X2FycmF5Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICBnZW9tZXRyeS5mYWNlVmVydGV4VXZzID0gW3V2X2FycmF5XTtcclxuICAgIH1cclxuXHJcbiAgICBnZW9tZXRyeS51dnNOZWVkVXBkYXRlID0gdHJ1ZTtcclxuXHJcbiAgICAvL1dlbGwsIHVzaW5nIGJsZW5kZXIgZmlsZSBub3JtYWxzIGRvZXMgbm90IHdvcmsuIFdpbGwgbmVlZCB0byBpbnZlc3RpZ2F0ZSB3aHkgbm9ybWFscyBmcm9tIHRoZSBibGVuZGVyIGZpbGUgZG8gbm90IHByb3ZpZGUgY29ycmVjdCByZXN1bHRzLiBcclxuICAgIC8vRm9yIG5vdywgaGF2ZSBUaHJlZSBjYWxjdWxhdGUgbm9ybWFscy4gXHJcblxyXG4gICAgZ2VvbWV0cnkuY29tcHV0ZVZlcnRleE5vcm1hbHMoKTtcclxuXHJcblxyXG4gICAgcmV0dXJuIGdlb21ldHJ5O1xyXG59OyIsIi8qanNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5cclxubGV0IGJsZW5kZXJfdGV4dHVyZV9jYWNoZSA9IHt9O1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlVGhyZWVKU1RleHR1cmUoaW1hZ2UpIHtcclxuICAgIGxldCBiYXNlNjQgPSByZXF1aXJlKFwiYmFzZTY0LWpzXCIpO1xyXG4gICAgbGV0IHBhcnNlZF9ibGVuZF9maWxlID0gaW1hZ2UuX19ibGVuZGVyX2ZpbGVfXztcclxuICAgIGxldCB0ZXh0dXJlID0gbnVsbDtcclxuICAgIGxldCBuYW1lID0gaW1hZ2UuYW5hbWU7XHJcblxyXG4gICAgaWYgKGltYWdlLnBhY2tlZGZpbGUpIHtcclxuXHJcbiAgICAgICAgaWYgKGJsZW5kZXJfdGV4dHVyZV9jYWNoZVtuYW1lXSkge1xyXG4gICAgICAgICAgICB0ZXh0dXJlID0gYmxlbmRlcl90ZXh0dXJlX2NhY2hlW25hbWVdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAvL2dldCB0aGUgZXh0ZW5zaW9uXHJcbiAgICAgICAgICAgIGxldCBleHQgPSBuYW1lLnNwbGl0KCcuJykucG9wKCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZGF0YSA9IGltYWdlLnBhY2tlZGZpbGU7XHJcblxyXG4gICAgICAgICAgICBsZXQgc2l6ZSA9IGRhdGEuc2l6ZTtcclxuXHJcbiAgICAgICAgICAgIGxldCBvZmZzZXQgPSBkYXRhLmRhdGEuX19kYXRhX2FkZHJlc3NfXztcclxuXHJcbiAgICAgICAgICAgIGxldCByYXdfZGF0YSA9IHBhcnNlZF9ibGVuZF9maWxlLmJ5dGUuc2xpY2Uob2Zmc2V0LCBvZmZzZXQgKyBzaXplKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBlbmNvZGVkRGF0YSA9IGJhc2U2NC5mcm9tQnl0ZUFycmF5KHJhd19kYXRhKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBkYXRhVVJJO1xyXG5cclxuICAgICAgICAgICAgc3dpdGNoIChleHQpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJwbmdcIjpcclxuICAgICAgICAgICAgICAgICAgICBkYXRhVVJJID0gXCJkYXRhOmltYWdlL3BuZztiYXNlNjQsXCIgKyBlbmNvZGVkRGF0YTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJqcGdcIjpcclxuICAgICAgICAgICAgICAgICAgICBkYXRhVVJJID0gXCJkYXRhOmltYWdlL2pwZWc7YmFzZTY0LFwiICsgZW5jb2RlZERhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBpbWcgPSBuZXcgSW1hZ2UoKTtcclxuXHJcbiAgICAgICAgICAgIGltZy5zcmMgPSBkYXRhVVJJO1xyXG5cclxuICAgICAgICAgICAgdGV4dHVyZSA9IG5ldyBUSFJFRS5UZXh0dXJlKGltZyk7XHJcblxyXG4gICAgICAgICAgICBpbWcub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGV4dHVyZS5uZWVkc1VwZGF0ZSA9IHRydWU7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBibGVuZGVyX3RleHR1cmVfY2FjaGVbbmFtZV0gPSB0ZXh0dXJlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0ZXh0dXJlO1xyXG59OyJdfQ==
