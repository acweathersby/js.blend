import { BlenderFile } from "../core/file";

export class ThreeJSExt extends BlenderFile {
  static async read(file: string | URL | ArrayBuffer): Promise<ThreeJSExt> {
    return ThreeJSExt.from(await BlenderFile.read(file));
  }

  static from(file: BlenderFile): ThreeJSExt {

    return Object.assign(new ThreeJSExt(file.binary), file);
  }

  //#ts-ignore
  getMesh(mesh_name: string) {
    let mesh = this.getObjectById(mesh_name) || this.getObjectById("ME" + mesh_name);

    if (!mesh)
      return undefined;

    let faces = mesh.mpoly;
    let loops = mesh.mloop;
    let verts = mesh.mvert;
    let UV = mesh.mloopuv;

    if (faces.length == 0) {
      return;
    }


    //precalculate the size of the array needed for faces
    var index_count = 0;
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

          verts_array_buff[index_count * 3 + 0] = +vert.co[0];
          verts_array_buff[index_count * 3 + 1] = +vert.co[2];
          verts_array_buff[index_count * 3 + 2] = -vert.co[1];

          if (vert.no) {
            normal_buffer[index_count * 3 + 0] = vert.no[0];
            normal_buffer[index_count * 3 + 1] = vert.no[2];
            normal_buffer[index_count * 3 + 2] = (-vert.no[1]);
          } else {
            normal_buffer[index_count * 3 + 0] = 1;
            normal_buffer[index_count * 3 + 1] = 0;
            normal_buffer[index_count * 3 + 2] = 0;
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

    return null;

  }
}
