
// Skybox texture from: https://github.com/mrdoob/three.js/tree/master/examples/textures/cube/skybox

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'

function linearInterpolate(a, b, t) {
    return a * (1 - t) + b * t;
}

function cosineInterpolate(a, b, t) {
    var cos_t = (1 - Math.cos(t * Math.PI)) * 0.5;
    return linearInterpolate(a, b, cos_t);
}

function degreesToRads(degrees) {
    return Math.PI / 180.0 * degrees;
}

// called after the scene loads
function onLoad(framework) {
    var scene = framework.scene;
    var camera = framework.camera;
    var renderer = framework.renderer;
    var gui = framework.gui;
    var stats = framework.stats;

    // Basic Lambert white
    var lambertWhite = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });

    // Set light
    var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    directionalLight.color.setHSL(0.1, 1, 0.95);
    directionalLight.position.set(1, 3, 2);
    directionalLight.position.multiplyScalar(10);

    // set skybox
    var loader = new THREE.CubeTextureLoader();
    var urlPrefix = '/images/skymap/';

    var skymap = new THREE.CubeTextureLoader().load([
        urlPrefix + 'px.jpg', urlPrefix + 'nx.jpg',
        urlPrefix + 'py.jpg', urlPrefix + 'ny.jpg',
        urlPrefix + 'pz.jpg', urlPrefix + 'nz.jpg'
    ] );

    scene.background = skymap;
    var curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 0, 0, 0 ),
        new THREE.Vector3( 1, 0.75, 0 ),
        new THREE.Vector3( 2, 3, 0 ),
        new THREE.Vector3( 5, 2, 0 )
    );

    var geometry = new THREE.Geometry();
    geometry.vertices = curve.getPoints( 50 );

    var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );

    // Create the final object to add to the scene
    var curveObject = new THREE.Line( geometry, material );
    scene.add(curveObject);

    // load a simple obj mesh
    var objLoader = new THREE.OBJLoader();
    objLoader.load('/geo/feather.obj', function(obj) {
        for (var i = 0; i < geometry.vertices.length; i++) {
            // LOOK: This function runs after the obj has finished loading
            var featherGeo = obj.children[0].geometry;
            var featherMesh = new THREE.Mesh(featherGeo, lambertWhite);
            featherMesh.name = "feather" + i;
            var scaleAmt = linearInterpolate(0.25, 1.0, i/geometry.vertices.length);
            featherMesh.scale.x = scaleAmt;
            featherMesh.scale.y = scaleAmt;
            featherMesh.scale.z = scaleAmt;

            scene.add(featherMesh);
            var feather = framework.scene.getObjectByName(featherMesh.name);
            feather.position.set(geometry.vertices[i].x,geometry.vertices[i].y,geometry.vertices[i].z);
            
            var yRotateAmt = linearInterpolate(80, 90, i/geometry.vertices.length);
            feather.rotateY(degreesToRads(yRotateAmt));
            var zRotateAmt = linearInterpolate(270, 0, i/geometry.vertices.length);
            feather.rotateZ(degreesToRads(zRotateAmt));
        }
    });

    // set camera position
    camera.position.set(0, 1, 5);
    camera.lookAt(new THREE.Vector3(0,0,0));

    // scene.add(lambertCube);
    scene.add(directionalLight);

    function buildAxes( length ) {
        var axes = new THREE.Object3D();

        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( length, 0, 0 ), 0xFF0000, false ) ); // +X
        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -length, 0, 0 ), 0xFF0000, true) ); // -X
        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, length, 0 ), 0x00FF00, false ) ); // +Y
        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -length, 0 ), 0x00FF00, true ) ); // -Y
        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, length ), 0x0000FF, false ) ); // +Z
        axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -length ), 0x0000FF, true ) ); // -Z

        return axes;

    }
    function buildAxis( src, dst, colorHex, dashed ) {
            var geom = new THREE.Geometry(),
                mat; 

            if(dashed) {
                    mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
            } else {
                    mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
            }

            geom.vertices.push( src.clone() );
            geom.vertices.push( dst.clone() );
            geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

            var axis = new THREE.Line( geom, mat, THREE.LinePieces );

            return axis;

    }

    scene.add(buildAxes(1));

    // edit params and listen to changes like this
    // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
    gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
        camera.updateProjectionMatrix();
    });
}

// called on frame updates
function onUpdate(framework) {
    var feather = framework.scene.getObjectByName("feather");    
    if (feather !== undefined) {
        // Simply flap wing
        var date = new Date();
        feather.rotateZ(Math.sin(date.getTime() / 100) * 2 * Math.PI / 180);        
    }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);