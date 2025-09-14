import { BlendObj } from "../core/file";

/**
 * Returns a set of index and vertex buffers corresponding to the mesh data in a "Mesh" or "Object" Blender object.
 * @param blend_obj {BlendObj} - An object data handle with the _type_ of "Object" or "Mesh".
 * @param origin {number} - The global origin of the mesh data.
 * @returns 
 */
export function loadMeshDataIntoBuffers(blend_obj: BlendObj, origin: number[] | Float32Array | Float64Array = [0.0, 0.0, 0.0] ) : null | {
  indices: Uint32Array,
  verts: Float32Array,
  normals: Float32Array,
  uvs: Float32Array,
} {

  if (!blend_obj) {
    throw new Error("blend_obj is invalid");
  }

  if (blend_obj._type_ == "Object" || blend_obj._type_ == "Mesh") {

    let mesh_data = blend_obj;

    if(blend_obj._type_ == "Object") {
      if (!blend_obj.data || blend_obj.data._type_ != "Mesh") {
        throw new Error(`Object ${blend_obj.name} is not a mesh object`);
      }
      mesh_data = blend_obj.data
    };


    let mpoly = mesh_data.mpoly,
      loops = mesh_data.mloop,
      UV = mesh_data.mloopuv,
      verts = mesh_data.mvert,
      num_of_polys = mpoly.length;

    var index_count = 0;

    //precalculate the size of the array needed for faces
    var face_indice_count = 0;
    var face_indice_counta = 0;

    for (var i = 0; i < num_of_polys; i++) {
      var poly = mpoly[i] || mpoly;
      var len = poly.totloop;
      var indexi = 1;

      face_indice_counta += (len * 2 / 3) | 0;

      while (indexi < len) {
        face_indice_count += 3;
        indexi += 2;
      }
    }

    //extract face info and dump into array buffer;
    var index_buffer = new Uint32Array(face_indice_count);
    var uv_buffer = new Float32Array(face_indice_count * 2);
    var normal_buffer = new Float32Array(face_indice_count * 3);
    var verts_array_buff = new Float32Array(face_indice_count * 3);

    for (var i = 0; i < num_of_polys; i++) {
      var poly = mpoly[i];
      var len = poly.totloop;
      var start = poly.loopstart;
      var indexi = 1;

      while (indexi < len) {
        let index = 0;

        for (var l = 0; l < 3; l++) {
          //Per Vertex 

          if ((indexi - 1) + l < len) {
            index = start + (indexi - 1) + l;
          } else {
            index = start;
          }

          
          var v = loops[index].v;
          var vert = verts[v];
          index_buffer[index_count] = index_count;
          
          //get normals, which are 16byte ints, and norm them back into floats.
          verts_array_buff[index_count * 3 + 0] = vert.co[0] + origin[0];
          verts_array_buff[index_count * 3 + 1] = vert.co[2] + origin[2];
          verts_array_buff[index_count * 3 + 2] = -vert.co[1] + -origin[1];

          if (vert.no)  {
            normal_buffer[index_count * 3 + 0] = vert.no[0];
            normal_buffer[index_count * 3 + 1] = vert.no[2];
            normal_buffer[index_count * 3 + 2] = (-vert.no[1]);
          }

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

    return {
      indices: index_buffer,
      normals: normal_buffer, 
      uvs: uv_buffer,
      verts: verts_array_buff
    }
  } else {
    throw new Error("blend_obj must have _type_ of 'Object'");
  }
}