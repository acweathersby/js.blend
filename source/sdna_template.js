//Store final DNA structs{}
class MASTER_SDNA_SCHEMA{
    constructor(version){
        this.version = version;
        this.SDNA_SET = false;
        this.byte_size = 0;
        this.struct_index = 0;
        this.structs = {};
        this.SDNA = {};
        this.endianess = false;
        this.pointer_size = 0;
    }

    set(array_buffer){
         var dv = new data_view(array_buffer);
        //find DNA1 dv block
        var offset = 3;

        while (true) {
            sdna_index = dv.getInt32(offset + pointer_size + 8, BIG_ENDIAN);
            code = toString(_data, offset, offset + 4).replace(/\u0000/g, "");
            block_length = dv.getInt32(offset + 4, true);
            offset += 16 + (pointer_size);
            if (code === "DNA1") {
                // DNA found; This is the core of the file and contains all the structure for the various dv types used in Blender.
                count = 0;
                var types = [],
                    fields = [],
                    names = [],
                    lengths = [],
                    name = "",
                    curr_name = "";

                //skip SDNA and NAME identifiers
                offset += 8;

                //Number of structs.
                count = dv.getInt32(offset, true);
                offset += 4;

                curr_count = 0;

                //Build up list of names for structs
                while (curr_count < count) {
                    curr_name = "";
                    while (dv.getInt8(offset) !== 0) {
                        curr_name += toString(_data, offset, offset + 1);
                        offset++;
                    }
                    names.push(curr_name);
                    offset++;
                    curr_count++;
                }


                //Adjust for 4byte alignment
                if ((offset % 4) > 0) offset = (4 - (offset % 4)) + offset;
                offset += 4;

                //Number of struct types
                count = dv.getInt32(offset, true);
                offset += 4;
                curr_count = 0;

                //Build up list of types
                while (curr_count < count) {
                    curr_name = "";
                    while (dv.getInt8(offset) !== 0) {
                        curr_name += toString(_data, offset, offset + 1);
                        offset++;
                    }
                    types.push(curr_name);
                    offset++;
                    curr_count++;
                }

                //Adjust for 4byte alignment
                if ((offset % 4) > 0) offset = (4 - (offset % 4)) + offset;
                offset += 4;
                curr_count = 0;

                //Build up list of byte lengths for types
                while (curr_count < count) {
                    lengths.push(dv.getInt16(offset, BIG_ENDIAN));
                    offset += 2;
                    curr_count++;
                }

                //Adjust for 4byte alignment
                if ((offset % 4) > 0) offset = (4 - (offset % 4)) + offset;
                offset += 4;

                //Number of structures
                var structure_count = dv.getInt32(offset, BIG_ENDIAN);
                offset += 4;
                curr_count = 0;

                //Create constructor objects from list of SDNA structs
                while (curr_count < structure_count) {
                    var struct_name = types[dv.getInt16(offset, BIG_ENDIAN)];
                    offset += 2;
                    obj = [];
                    count = dv.getInt16(offset, BIG_ENDIAN);
                    offset += 2;
                    curr_count2 = 0;
                    struct_names.push(struct_name);

                    //Fill an array with name, type, and length for each SDNA struct property
                    while (curr_count2 < count) {
                        obj.push(names[dv.getInt16(offset + 2, BIG_ENDIAN)], types[dv.getInt16(offset, BIG_ENDIAN)], lengths[dv.getInt16(offset, BIG_ENDIAN)]);
                        offset += 4;
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
            offset += block_length;
        }
    }

    getSDNAStructureConstructor(name, struct) {
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
                            //TOOD: consider configuring for pointers
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
}