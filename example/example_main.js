window.onload = function() {
    var drop_zone = document.getElementById("blend_file_dd");
    var blend_parser = jsblend(true);

    //threes js code
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    function render() {
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    camera.rotation.x = 89;
    camera.position.z = 1;

    var light = new THREE.PointLight(0xFFFFFF, 0.8, 1000);
    light.position.set(0, 0, 10);
    light.shadow = null;
    scene.add(light);

    var light = new THREE.PointLight(0xFFFFFF, 0.8, 0);
    light.position.set(0, 0, -10);
    light.shadow = null;
    scene.add(light);


    //Load data from drag and drop operation on blend element
    function readFile(file, index) {
        var ext = (file.name.match(/\.(.*)/)) ? file.name.match(/\.(.*)/)[1] : null;
        switch (ext) {
            case "blend":
                //copy blend file arraybuffer and load in blender file parser
                blend_parser.loadBlendFromBlob(file.slice(), file.name);
                break;
            default:
                console.log("file format not supported");
                return;
        }
    }
    drop_zone.addEventListener("drop", function(e) {
        e.preventDefault();
        for (var i = 0, l = e.dataTransfer.files.length; i < l; i++) {
            readFile(e.dataTransfer.files[i], i);
        }

    });

    function handleScrollWheel(x) {
        camera.position.y -= x * 0.005;
    }
    //Firefox scroll listener
    window.addEventListener("DOMMouseScroll", function(e) {
        handleScrollWheel(-e.detail);
        e.preventDefault();
        e.stopPropagation();
    });
    //Every other browser scroll listener
    window.addEventListener("mousewheel", function(e) {
        handleScrollWheel(e.wheelDelta);
        e.preventDefault();
        e.stopPropagation();

    });

    //need these to prevent default action for drag and drop
    drop_zone.addEventListener("dragenter", function(e) {
        e.preventDefault();
        e.stopPropagation();
    });
    drop_zone.addEventListener("dragover", function(e) {
        e.preventDefault();
        e.stopPropagation();
    });
    window.addEventListener("dragenter", function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    var blender_types = {
        mesh_object: 1,
    };

    function createThreeJSGeometry(blender_mesh, origin) {
        //get materials
        var mats = blender_mesh.mat, materials = [];
        for(var i = 0; i < mats.length; i++){
            var material = createThreeJSMaterial(mats[i]);
            materials.push(material);
        }




        let pick_material = 0;
            mesh = blender_mesh,
            faces = mesh.mpoly,
            loops = mesh.mloop,
            UV = mesh.mloopuv || null,
            verts = mesh.mvert,
            vert_array = [],
            face_array = [],
            uv_array = [],
            normal_array = [];

        var geometry = new THREE.Geometry();

        if (!faces) return geometry;


        var index_count = 0;
        
        for(var i = 0; i < verts.length; i++){
            let vert = verts[i];
            vert_array.push(new THREE.Vector3(vert.co[0]+origin[0],vert.co[1]+origin[1],vert.co[2]+origin[2]));
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

                    //get normals, which are 16byte ints, and norm them back into floats ;)

                    var
                        n1 = vert.no[0],
                        n2 = vert.no[1],
                        n3 = vert.no[2];

                    var nl = 1;Math.sqrt((n1 * n1) + (n2 * n2) + (n3 * n3));

                    face_normals.push(new THREE.Vector3(n1/nl, n2/nl, n3/nl));

                    if (UV) {
                        var uv = UV[index].uv;
                        uv_array.push(uv[0], uv[1]);
                    }
                }
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
        
        //Well, using blender file normals does not work. Will need to investigate why normals from the blender file do not provide correct results. 
        //For now, have Three calculate normals. 
       geometry.computeVertexNormals();
        
        return geometry;
    };

    function createThreeJSMaterial(blend_mat) {
        var material = new THREE.MeshPhongMaterial();
        material.color.setRGB(blend_mat.r, blend_mat.g, blend_mat.b);
        //material.color.setRGB(3, 2, 1);
        material.specular.setRGB(blend_mat.specr, blend_mat.specg, blend_mat.specb);
        material.shininess = blend_mat.spec;
        material.reflectivity = blend_mat.ref;
        return material;
    }

    blend_parser.onParseReady = function(parsed_blend_file) {


        var materials = [];
        if(parsed_blend_file.objects.Material){    
            for (var i = 0; i < parsed_blend_file.objects.Material.length; i++) {
                var mat = createThreeJSMaterial(parsed_blend_file.objects.Material[i]);

                materials.push(mat);
            }
        }

        //build object from blender mesh object
        for (let i = 0; i < parsed_blend_file.objects.Object.length; i++) {
            let obj = parsed_blend_file.objects.Object[i];
            console.log(obj);

            if (obj.type == blender_types.mesh_object) {
                if (obj.data) {
                    //get the mesh 
                    console.log(obj.orig)
                    var geometry = createThreeJSGeometry(obj.data, [0,0,0]);

                    //create a transform from the mesh object
                    var mesh = new THREE.Mesh(geometry, geometry.blend_mat || materials[0]);
                    console.log(materials[0])
                    scene.add(mesh);

                    mesh.rotateZ(obj.rot[2])//*180/Math.PI;
                    mesh.rotateY(obj.rot[1])//*180/Math.PI;
                    mesh.rotateX(obj.rot[0])//*180/Math.PI;
                    mesh.scale.fromArray(obj.size, 0);
                    mesh.position.fromArray([obj.loc[0], (obj.loc[1]), (obj.loc[2])], 0);

                    console.log(obj.aname, obj.loc, obj.orig, obj.rot, obj.size, obj)
                }
            }
        }
    };
    render();

};