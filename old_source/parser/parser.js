/*jshint esversion: 6 */

const DNA1 = 826363460;
const ENDB = 1111772741;

/* Note: Blender coordinates treat the Z axis as the vertical an Y as depth. */

module.exports = (function(unzipper) {

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
            ERROR = null,
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
                self.postMessage(FILE, ERROR);
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
        };

        function charProp(offset, Blender_Array_Length, length) {
            return {
                get: function() {
                    if (Blender_Array_Length > 1) {
                        let start = this.__data_address__ + offset;
                        let end = start;
                        let buffer_guard = 0;

                        while (this.__blender_file__.byte[end] != 0 && buffer_guard++ < length) end++;

                        return toString(this.__blender_file__.AB, start, end);
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
                            j++;
                        }

                    };

                    return results;
                },
                set: function() {}
            };
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
                            off += length;
                            j++;
                        }

                        return array;
                    } else {
                        let pointer = this.__blender_file__.getPointer(this.__data_address__ + offset, this.__blender_file__);
                        return this.__blender_file__.memory_lookup[pointer];
                    }
                },
                set: function() {}
            };
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
                                            array.push(this[array_names[i]]);
                                        }
                                        return array;
                                    };
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
            return FILE.memory_lookup[pointer];
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
                if (this.__list__ === null) return this;
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
            if (toString(_data, offset, 7) !== "BLENDER") return ERROR = "File supplied is not a .blend compatible Blender file.";

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