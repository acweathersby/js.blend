import { arrayGetter, toString } from "./utils";
import { BlenderFile, BlenderBlock } from "./file";

export class SDNA {
  readonly little: boolean;
  readonly ptr_size: number;
  dv: DataView;

  prop_names: string[] = [];
  type_names: string[] = [];
  type_sizes: Uint16Array = new Uint16Array();
  struct_definitions: SDNAStruct[] = [];
  struct_name_lu: Map<string, SDNAStruct> = new Map();

  constructor(dv: DataView, little: boolean, ptr_size: number) {
    this.dv = dv;
    this.little = little;
    this.ptr_size = ptr_size;
  }


  getPropertyDescriptors(bf: BlenderFile, sdn_nr: number): PropertyDescriptorMap | null {


    let def = this.struct_definitions[sdn_nr];

    if (!def) {
      return null;
    }

    if (def.property_descriptors) {
      return def.property_descriptors;
    }

    let object_props = <any>{};
    let offset = 0;

    for (const prop of def.props()) {

      let name = prop.name;

      let obj_prop = {
        get: (...any: any[]): any => { },
        set: () => { },
        enumerable: true,
        configurable: false
      };

      // @ts-ignore
      if (prop.is_array && prop.array_data) {
        let { base_name, lengths } = prop.array_data;

        let getter = null;

        if (prop.type == "char" && lengths.length == 1) {
          /// Replace with a string. 
          obj_prop.get = ((off: number, length: number) => function () {
            // @ts-ignore
            return toString(this.dv.buffer, this.dv.byteOffset + off, length);
          })(offset, lengths[0]);
        } else if (prop.is_pointer) {
          obj_prop.get = ((length: number, ptr_size: number, bf: BlenderFile) => function (offset: number) {
            let objs = [];
            for (let i = 0; i < length; i++) {
              let off = offset + i * ptr_size;
              // @ts-ignore
              let t = this;
              let dv = <DataView>(t).dv;
              let ptr = bf.pointer_size > 4 ? dv.getBigInt64(off, bf.little_endian) : BigInt(dv.getInt32(off, bf.little_endian));
              let val = bf.address_map.get(ptr);
              if (val) {
                // @ts-ignore - SDNA is friend of BlenderFile
                objs.push(bf.createObject(new BlenderBlock(val, bf)));
              } else {
                objs.push(null);
              }
            }
            return objs;
          })(lengths[0], prop.size, bf);
        } else {
          switch (prop.type) {
            case "float":
              getter = ((base_size: number, length: number, little_endian: boolean) => function (offset: number) {
                // @ts-ignore)
                return new Float32Array(this.dv.buffer, this.dv.byteOffset + offset, length);
              })(prop.size, lengths[lengths.length - 1], bf.little_endian);
              break;
            case "double":
              getter = ((base_size: number, length: number, little_endian: boolean) => function (offset: number) {
                // @ts-ignore)
                return new Float64Array(this.dv.buffer, this.dv.byteOffset + offset, length);
              })(prop.size, lengths[lengths.length - 1], bf.little_endian);
              break;
          }

          if (getter) {
            obj_prop.get = ((base_size: number, lengths: number[], offset: number, getter: any) => function () {
              // @ts-ignore
              return arrayGetter(offset, base_size, 0, lengths, this, getter);
            })(prop.size, lengths, offset, getter);
          }
        }
        name = base_name;
      } else if (prop.is_pointer) {
        obj_prop.get = ((off: number, bf: BlenderFile) => function () {
          // @ts-ignore
          let t = this;
          let dv = <DataView>(t).dv;
          let ptr = bf.pointer_size > 4 ? dv.getBigInt64(off, bf.little_endian) : BigInt(dv.getInt32(off, bf.little_endian));
          let val = bf.address_map.get(ptr);
          if (val || ptr == 0n) {
            // @ts-ignore - SDNA is friend of BlenderFile
            return bf.createObject(new BlenderBlock(val, bf));
          } else {
            return null;
          }
        })(offset, bf);

        name = name.slice(1);
      } else {
        switch (prop.type) {
          case "uint64_t":
            obj_prop.get = ((off: number, little_endian: boolean) => function () {
              // @ts-ignore
              return BigInt.asUintN(64, this.dv.getBigInt64(off, little_endian));
            })(offset, bf.little_endian);
            break;
          case "double":
            obj_prop.get = ((off: number, little_endian: boolean) => function () {
              // @ts-ignore
              return this.dv.getFloat64(off, little_endian);
            })(offset, bf.little_endian);
            break;
          case "float":
            obj_prop.get = ((off: number, little_endian: boolean) => function () {
              // @ts-ignore
              return this.dv.getFloat32(off, little_endian);
            })(offset, bf.little_endian);
            break;
          case "int":
            obj_prop.get = ((off: number, little_endian: boolean) => function () {
              // @ts-ignore
              return this.dv.getInt32(off, little_endian);
            })(offset, bf.little_endian);
            break;
          case "uint":
            obj_prop.get = ((off: number, little_endian: boolean) => function () {
              // @ts-ignore
              return this.dv.getUint32(off, little_endian);
            })(offset, bf.little_endian);
            break;
          case "short":
            obj_prop.get = ((off: number, little_endian: boolean) => function () {
              // @ts-ignore
              return this.dv.getInt16(off, little_endian);
            })(offset, bf.little_endian);
            break;
          case "ushort":
            obj_prop.get = ((off: number, little_endian: boolean) => function () {
              // @ts-ignore
              return this.dv.getUint16(off, little_endian);
            })(offset, bf.little_endian);
            break;
          case "char":
            obj_prop.get = ((off: number) => function () {
              // @ts-ignore
              return this.dv.getInt8(off);
            })(offset);
            break;
          case "uchar":
            obj_prop.get = ((off: number) => function () {
              // @ts-ignore
              return this.dv.getInt8(off);
            })(offset);
            break;
          default: {
            let def = this.struct_name_lu.get(prop.type);

            if (def) {
              obj_prop.get = ((off: number, sdna_index: number, size: number, bf: BlenderFile) => function () {
                // @ts-ignore
                return bf.createFromSDNAOffset(sdna_index, this.dv.byteOffset + off, size);
              })(offset, def.sdna_index, prop.full_size, bf);
            } else {
              name += `<${prop.type}>[${prop.full_size}]`;
            }
          }
        }
      }

      object_props[name] = obj_prop;
      offset += prop.full_size;
    }

    def.property_descriptors = object_props;

    return object_props;
  }


  getPrototype(bf: BlenderFile, sdn_nr: number): object | null {
    let def = this.struct_definitions[sdn_nr];

    if (!def) {
      return null;
    }

    if (!def.proto) {
      let obj = this.getPropertyDescriptors(bf, sdn_nr);
      if (obj) {
        def.proto = Object.create({}, obj);
      }
    }
    return def.proto;
  }
}
export class SDNAStruct {
  offset: number;
  sdna: SDNA;
  proto: null | object = null;
  property_descriptors: null | PropertyDescriptorMap = null;
  _name: string | null = null;
  i: number = 0;
  have_id: boolean = false;

  constructor(offset: number, i: number, sdna: SDNA) {
    this.i = i;
    this.offset = offset;
    this.sdna = sdna;

    let nop = this.num_of_props;
    const dv = this.sdna.dv;
    const little = this.sdna.little;
    for (var i = 0; i < nop; i++) {
      let o = offset + 4 + (i << 2);
      let prop_type_index = dv.getInt16(o, little);
      let prop_name_index = dv.getInt16(o + 2, little);
      let prop_name = this.sdna.prop_names[prop_name_index];
      if (prop_name == "id") {
        this.have_id = true;
        break;
      }
    }

  }

  get sdna_byte_size(): number {
    return 4 + this.num_of_props * 4;
  }

  get byte_size(): number {
    let size = 0;
    for (const prop of this.props()) {
      size += prop.full_size;
    }
    return size;
  }

  get index(): number {
    let dv = this.sdna.dv;
    return dv.getInt16(this.offset, this.sdna.little);
  }

  get sdna_index(): number {
    return this.i;
  }

  get num_of_props(): number {
    let dv = this.sdna.dv;
    return dv.getInt16(this.offset + 2, this.sdna.little);
  }

  get name(): string {
    if (this._name) {
      return this._name;
    } else {
      this._name = this.sdna.type_names[this.index];
      return this._name;
    }
  }

  *props() {
    const offset = this.offset + 4;
    const nop = this.num_of_props;
    const dv = this.sdna.dv;
    const little = this.sdna.little;

    for (var i = 0; i < nop; i++) {
      let o = offset + (i << 2);
      let prop_type_index = dv.getInt16(o, little);
      let prop_name_index = dv.getInt16(o + 2, little);
      let prop_name = this.sdna.prop_names[prop_name_index];

      let is_pointer = prop_name[0] == "*";
      let is_array = prop_name[prop_name.length - 1] == "]";
      let array_data = null;

      let size = this.sdna.type_sizes[prop_type_index];

      if (is_array) {
        let [base_name, ...array_part] = prop_name.split("[");
        let sections = array_part.map((s) => parseInt(s.slice(0, -1)));

        if (base_name[0] == "*") {
          base_name = base_name.slice(1);
        }

        array_data = {
          base_name,
          dimensions: sections.length,
          lengths: sections
        };
      }

      let full_size = 0;

      if (is_pointer) {
        full_size += this.sdna.ptr_size;
      } else if (array_data) {
        full_size += size * array_data.lengths.reduce((a, b) => a * b, 1);
      } else {
        full_size += size;
      }

      yield {
        name: prop_name,
        is_array,
        array_data,
        is_pointer,
        full_size,
        size,
        type: this.sdna.type_names[prop_type_index],
      };
    }
  }
}
export function getNameList(dv: DataView, offset: number, len: number): { s: string[]; o: number; } {
  let strings = [];

  for (let i = 0; i < len; i++) {
    let s = offset;
    while (dv.getInt8(offset) !== 0) offset++;
    strings.push(toString(dv.buffer, dv.byteOffset + s, offset - s));
    offset++;
  }

  return { s: strings, o: offset };
}
