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

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshPhongMaterial({
        color: 0x00ff00
    });
    var cube = new THREE.Mesh(geometry, material);
    // scene.add(cube);

    camera.position.z = 5;

    var light = new THREE.PointLight(0xFFFFFF, 1, 100);
    light.position.set(10, 10, 2);
    scene.add(light);

    var light = new THREE.PointLight(0xFFFFFF, 0.7, 100);
    light.position.set(-10, 10, 5);
    scene.add(light);

    var light = new THREE.PointLight(0xFFFFFF, 0.5, 100);
    light.position.set(0, 10, 8);
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
        camera.position.z -= x * 0.005;
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

    blend_parser.onParseReady = function(parsed_blend_file) {
      console.log(parsed_blend_file)
      for(var u = 0; u < parsed_blend_file.objects.Mesh.length; u++){
        e = parsed_blend_file.objects.Mesh[u];
        console.log(e.id.name);
        console.log((e.id.name = "tod"));
        console.log(e.id.name);
        //Getting model info out of mesh object
        var faces = e.mpoly,
            loops = e.mloop,
            UV = e.mloopuv || null,
            verts = e.mvert,
            vert_array = [],
            face_array = [],
            uv_array = [];
        if (!faces) return;
        var geometry = new THREE.Geometry();
        var index_count = 0;
        for (var i = 0; i < faces.length; i++) {
            var face = faces[i] || faces;
            var len = face.totloop;
            var start = face.loopstart;
            var indexi = 1;

            while (indexi < len) {
                for (var l = 0; l < 3; l++) {
                    if ((indexi - 1) + (1 * l) < len) {
                        index = start + (indexi - 1) + (1 * l);
                    } else {
                        index = start;
                    }
                    var v = loops[index].v;
                    var vert = verts[v];
                    index_count++;
                    vert_array.push(new THREE.Vector3(vert.co[0], vert.co[2], -vert.co[1]));
                    if (UV) {
                        var uv = UV[index].uv;
                        uv_array.push(uv[0], uv[1]);
                    }
                }
                face_array.push(new THREE.Face3(index_count - 3, index_count - 2, index_count - 1));
                indexi += 2;
            }
        }

        geometry.vertices = vert_array;
        geometry.faces = face_array;
        geometry.computeBoundingSphere();
        geometry.mergeVertices();
        geometry.computeFaceNormals();

        var material = new THREE.MeshPhongMaterial({
            color: 0xff0000
        });

        scene.add(new THREE.Mesh(geometry, material));

      }
    };
    render();

};
