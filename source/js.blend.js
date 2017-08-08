sDNA_Struct_Properties = {

}

var jsblend = (function(USE_WEBWORKER, UNUSED_NETWORK_PORT) {
    //A helper object to identify Blender Object structs by type name. 
    var blender_types = {
        mesh_object: 1,
    };


    //web worker not functional in this version
    USE_WEBWORKER = false;

    var web_address = "localhost:" + (UNUSED_NETWORK_PORT || 5512),
        code = "(" + worker_code.toString() + ")();",
        worker = null,
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

    if (USE_WEBWORKER) {
        worker = new Worker(URL.createObjectURL(new Blob([code], {
            type: 'text/javascript'
        })));
        worker.onmessage = function(message) {
            return_object.onParseReady(message.data);
        };
    } else {
        worker = new worker_code();
        worker.postMessage = function(message) {
            return_object.onParseReady(message);
        };
    }


    //CODE FOR WEBWORKER

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
            Export object for a parsed file.
        */

        var BLENDER_FILE = function(AB) {
            this.AB = AB;
            //this.double = new Float64Array(AB);
            this.float = new Float32Array(AB);
            this.int = new Int32Array(AB);
            this.short = new Int16Array(AB);
            this.byte = new Uint8Array(AB);

            this.objects = {};
            this.memory_lookup = {},
            this.object_array = [];

            this.template = null;
        };

        BLENDER_FILE.prototype = {
            addObject: function(obj) {
                this.object_array.push(obj);
                if(!this.objects[obj.blender_name]) this.objects[obj.blender_name] = [];
                this.objects[obj.blender_name].push(obj);
            },
            primeTypes: function(list_of_dna_names) {
                for (var i = 0; i < list_of_dna_names.length; i++) {
                    //this.objects[list_of_dna_names[i]] = [];
                }
            },
            setPointers: function() {
                for (var i = 0, l = this.object_array.length; i < l; i++) {
                    this.object_array[i].setPointers();
                }
            }
        };

        function getDocument(data) {
            var obj = readFile(null, data);
        }

        self.onmessage = parseFile;
        this.onmessage = parseFile;

        /*
            These functions map offsets in the blender file to basic types (byte,short,int,float) through TypedArrays;
            This allows the underlying binary data to be changed.
        */

        function float64Prop(offset, Array_match, length) {
            return {
                get: function() {
                    return (Array_match) ? new Float64Array(this.blender_file.AB, this.pointer + offset, length) : this.blender_file.double[(this.pointer + offset) >> 2];
                },
                set: function(float) {
                    if (Array_match) {} else {
                        this.blender_file.double[(this.pointer + offset) >> 3] = +float;
                    }
                },
            };
        }

        function floatProp(offset, Array_match, length) {
            return {
                get: function() {
                    return (Array_match) ? new Float32Array(this.blender_file.AB, this.pointer + offset, length) : this.blender_file.float[(this.pointer + offset) >> 2];
                },
                set: function(float) {
                    if (Array_match) {} else {
                        this.blender_file.float[(this.pointer + offset) >> 2] = +float;
                    }
                },
            };
        }

        function intProp(offset, Array_match, length) {
            return {
                get: function() {
                    return (Array_match) ? new Int32Array(this.blender_file.AB, this.pointer + offset, length) : this.blender_file.int[(this.pointer + offset) >> 2];
                },
                set: function(int) {
                    if (Array_match) {} else {
                        this.blender_file.int[(this.pointer + offset) >> 2] = int | 0;
                    }
                },
            };
        }

        function shortProp(offset, Array_match, length) {
            return {
                get: function() {
                    return (Array_match) ? new Uint16Array(this.blender_file.AB, this.pointer + offset, length) : this.blender_file.short[(this.pointer + offset) >> 1];
                },
                set: function(short) {
                    if (Array_match) {} else {
                        this.blender_file.short[(this.pointer + offset) >> 1] = short | 0;
                    }
                },
            };
        }


        function charProp(offset, Array_match, length) {
            return {
                get: function() {
                    return (Array_match) ? toString(this.blender_file.AB, this.pointer + offset, this.pointer + offset + length) : this.blender_file.byte[(this.pointer + offset)];
                },
                set: function(byte) {
                    if (Array_match) {
                        var string = byte + "",
                            i = 0,
                            l = string.length;
                        while (i < length) {
                            if (i < l) {
                                this.blender_file.byte[(this.pointer + offset + i)] = string.charCodeAt(i) | 0;
                            } else {
                                this.blender_file.byte[(this.pointer + offset + i)] = 0;
                            }
                            i++;
                        }
                    } else {
                        this.blender_file.byte[(this.pointer + offset)] = byte | 0;
                    }
                }
            };
        }

        function pointer64Prop(offset, Array_match, length){

        }

        function pointer32Prop(offset, Array_math, length){

        }


        //Store final DNA structs
        var MASTER_SDNA_SCHEMA = function(version) {
            this.version = version;
            this.SDNA_SET = false;
            this.byte_size = 0;
            this.struct_index = 0;
            this.structs = {};
            this.SDNA = {};
        };
        MASTER_SDNA_SCHEMA.prototype = {
            getSDNAStructureConstructor: function(name, struct) {
                if (struct) {
                    var blen_struct = Function("function " + name + "(){}; return " + name)();

                    blen_struct.prototype = new BLENDER_STRUCTURE();
                    blen_struct.prototype.__list = [];
                    blen_struct.prototype.blender_name = name;
                    blen_struct.prototype.__pointers = [];

                    var offset = 0;
                    //Create properties of struct
                    for (var i = 0; i < struct.length; i += 3) {
                        var _name = struct[i],
                            n = _name,
                            type = struct[i + 1],
                            length = struct[i + 2],
                            match = null,
                            Array_match = 0,
                            Pointer_Match = 0;
                            var DNA = this.SDNA[name] = {
                                constructor: blen_struct
                            };

                        if ((match = _name.match(/([\w\*]*)\[(\w*)]/))) {
                            Array_match = parseInt(match[2]);
                            length = Array_match * length;
                            _name = match[1];
                        }
                        if (_name.match(/\*/g)) {
                            Pointer_Match = 10;
                            _name = _name.replace(/\*/g, "");
                            blen_struct.prototype.__pointers.push(_name);
                        }

                        DNA[n] = {
                            type: type,
                            length: length,
                            isArray: (Array_match > 0),
                        };

                        if (!Pointer_Match) {
                            switch (type) {
                                case "double":
                                    Object.defineProperty(blen_struct.prototype, _name, float64Prop(offset, Array_match, length >> 3));
                                    break;
                                case "float":
                                    Object.defineProperty(blen_struct.prototype, _name, floatProp(offset, Array_match, length >> 2));
                                    break;
                                case "int":
                                    Object.defineProperty(blen_struct.prototype, _name, intProp(offset, Array_match, length >> 2));
                                    break;
                                case "short":
                                case "ushort":
                                    Object.defineProperty(blen_struct.prototype, _name, shortProp(offset, Array_match, length >> 1));
                                    break;
                                case "char":
                                case "uchar":
                                    Object.defineProperty(blen_struct.prototype, _name, charProp(offset, Array_match, length));
                                    break;
                                default:
                                    blen_struct.prototype[_name] = null;
                                    blen_struct.prototype.__list.push(_name, type, length, offset, Array_match, Pointer_Match);
                            }
                        } else {
                            blen_struct.prototype[_name] = null;
                            blen_struct.prototype.__list.push(_name, type, length, offset, Array_match, Pointer_Match);
                        }
                        if (Pointer_Match > 0) {
                            blen_struct.prototype._length += pointer_size;
                            offset += pointer_size;
                        } else {
                            blen_struct.prototype._length += length;
                            offset += length;
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
            this.blender_file = null;

            this.__pointers = null;
            this.__list = null;
            this.address = null;
            this.length = 0;
            this.pointer = 0;
            this.blender_name = "";
            this._length = 0;
        };


        /*
            Returns a pre-constructed BLENDER_STRUCTURE or creates a new BLENDER_STRUCTURE to match the DNA struct type
        */
        var pointer_function = (pointer)=>()=>{return FILE.memory_lookup[pointer]};
        
        function getPointer(offset){
                var pointerLow = data.getUint32(offset, BIG_ENDIAN);
            if(pointer_size > 4){
                var pointerHigh = data.getUint32(offset+4, BIG_ENDIAN);

                if(BIG_ENDIAN){
                    return  (pointerLow) +""+ pointerHigh;
                }else{
                    return  (pointerHigh) +""+ pointerLow;
                }
            }else{
                return pointerLow;
            }
            
        }

        BLENDER_STRUCTURE.prototype = {
            setArrays: function(BLENDER_FILE) {
                this.blender_file = BLENDER_FILE;
            },
            setData: function(pointer, _data_offset, data_block_length, BLENDER_FILE) {
                if(this.__list == null) return this;
                BLENDER_FILE.addObject(this);

                this.blender_file = BLENDER_FILE;

                var struct = this.__list,
                    j = 0,
                    i = 0,
                    obj, name = "",
                    type, length, Array_match, Pointer_Match, offset, constructor;

                this.pointer = _data_offset;

                if (struct === null) return this;

                for (i = 0; i < struct.length; i += 6) {
                    obj = null;
                    name = struct[i];
                    type = struct[i + 1];
                    Array_match = struct[i + 4];
                    Pointer_Match = struct[i + 5];
                    offset = this.pointer + struct[i + 3];
                    
                    if (Pointer_Match) {
                        if (Array_match) {
                            this[name] = [];
                            j = 0;
                            while (j < Array_match) {
                                if (offset + pointer_size > data_block_length) {
                                    return this;
                                }
                                this[name].push(BLENDER_FILE.memory_lookup[getPointer(offset)]);
                                offset += pointer_size;
                                j++;
                            }
                        } else {
                            if (offset + pointer_size > data_block_length) {
                                return this;
                            }

                            Object.defineProperty(this, name, {get:pointer_function(getPointer(offset))})
                        }
                        continue;
                    }else if (Array_match) {
                        this[name] = [];
                        j = 0;
                        while (j < Array_match) {
                            if (current_SDNA_template.getSDNAStructureConstructor(type)) {
                                constructor = current_SDNA_template.getSDNAStructureConstructor(type);
                                this[name].push((new constructor()).setData(0, offset, offset + length / Array_match, BLENDER_FILE));
                            } else this[name].push(null);
                            offset += length / Array_match;
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
                this.__list = null;
                return this;
            },

            getPointer: function(address) {
                return memory_lookup[address] || null;
            },

            setPointers: function() {
                var E = this;

                function b(e, i, a) {
                    a[i] = E.getPointer(e);
                }
                for (var i = 0; i < this.__pointers.length; i++) {
                    var name = this.__pointers[i];
                    if (this[name] && typeof this[name] == "object") {
                        this[name].forEach(b);
                    } else {
                        this[name] = this.getPointer(this[name]);
                    }
                }
            },
            get aname() {
                if (this.id) return this.id.name.slice(2);
                else return undefined;
            }
        };

        function toString(buffer, _in, _out) {
            return String.fromCharCode.apply(String, new Uint8Array(buffer, _in, _out - _in));
        }
        //Begin parsing blender file
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

            // Make sure we have a .blend file. All blend files have the first 12bytes
            // set with BLENDER-v### in Utf-8
            if (toString(_data, offset, 7) !== "BLENDER") return console.warn("File supplied is not a .blend compatible file.");
            
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

                //find DNA1 data block
                offset2 = offset;

                while (true) {
                    sdna_index = data.getInt32(offset2 + pointer_size + 8, BIG_ENDIAN);
                    code = toString(_data, offset2, offset2 + 4).replace(/\u0000/g, "");
                    block_length = data.getInt32(offset2 + 4, true);
                    offset2 += 16 + (pointer_size);
                    if (code === "DNA1") {
                        // DNA found; This is the core of the file and contains all the structure for the various data types used in Blender.
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
            
            //What does this do? 
            
            // FILE.primeTypes(current_SDNA_template.SDNA_NAMES);
            
            // Nothing, that's what.

            //parse the rest of the data, starting back at the top.
            //TODO: turn into on-demand parsing.

            while (true) {
                if ((offset % 4) > 0) {
                    offset = (4 - (offset % 4)) + offset;
                }

                data_offset = offset;
                sdna_index = data.getInt32(offset + pointer_size + 8, BIG_ENDIAN);
                code = toString(_data, offset, offset + 4).replace(/\u0000/g, "");

                offset2 = offset + 16 + (pointer_size);
                offset += data.getInt32(offset + 4, true) + 16 + (pointer_size);

                if (code === "DNA1") {
                    //skip - already processed at this point
                } else if (code === "ENDB") {
                    //end of file found
                    break;
                } else {
                    //Create a Blender object using a constructor template from current_SDNA_template
                    var data_start = data_offset + pointer_size + 16;
                    
                   // if(current_SDNA_template.SDNA_NAMES[sdna_index] == "Link") debugger
                    //Get a SDNA constructor by name;
                    var constructor = current_SDNA_template.getSDNAStructureConstructor(current_SDNA_template.SDNA_NAMES[sdna_index]);
                    
                    var size = data.getInt32(data_offset + 4, BIG_ENDIAN);
                
                    count = data.getInt32(data_offset + 12 + pointer_size, BIG_ENDIAN);
                    
                    if(count > 0){
                        var obj = new constructor();
                        
                        var length = constructor.prototype._length;
                        
                        
                        var address = getPointer(data_offset+8);
                        
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
