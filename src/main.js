
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

var xAxis = new THREE.Vector3(1,0,0);
var yAxis = new THREE.Vector3(0,1,0);
var zAxis = new THREE.Vector3(0,0,1);
var numFeathers = 45;
var windForce = 10;

// called after the scene loads
function onLoad(framework) {
    var scene = framework.scene;
    var camera = framework.camera;
    var renderer = framework.renderer;
    var gui = framework.gui;
    var stats = framework.stats;

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
    
    var lineMaterial = new THREE.LineBasicMaterial();
    //right wing
    var rightWing = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 0.1, 0, 0 ),
        new THREE.Vector3( 1, 0.75, 0 ),
        new THREE.Vector3( 2, 3, 0 ),
        new THREE.Vector3( 5, 2, 0 )
    );

    var rightWingGeom = new THREE.Geometry();
    rightWingGeom.vertices = rightWing.getPoints(numFeathers);
    var rightWingObject = new THREE.Line(rightWingGeom, lineMaterial);
    rightWingObject.name = "rightWingCurve";
    scene.add(rightWingObject);

    //left wing
    var leftWing = new THREE.CubicBezierCurve3(
        new THREE.Vector3( -0.1, 0, 0 ),
        new THREE.Vector3( -1, 0.75, 0 ),
        new THREE.Vector3( -2, 3, 0 ),
        new THREE.Vector3( -5, 2, 0 )
    );

    var leftWingGeom = new THREE.Geometry();
    leftWingGeom.vertices = leftWing.getPoints(numFeathers);

    var leftWingObject = new THREE.Line(leftWingGeom, lineMaterial);
    leftWingObject.name = "leftWingCurve";
    scene.add(leftWingObject);

    createWings(numFeathers, scene, rightWingObject, leftWingObject);

    // set camera position
    camera.position.set(0, 1, 5);
    camera.lookAt(new THREE.Vector3(0,0,0));
    scene.add(directionalLight);

    // edit params and listen to changes like this
    // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
    gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
        camera.updateProjectionMatrix();
    });
}

function removeWings(numFeathers, scene) {
    for (var i = 0; i < numFeathers; i++) {
        var rightFeather = scene.getObjectByName("rightFeather"+i);
        scene.remove(rightFeather);
        var leftFeather = scene.getObjectByName("leftFeather"+i);
        scene.remove(leftFeather);
    }
}

function createWings(numFeathers, scene, rightWingObject, leftWingObject) {
    // load a simple obj mesh multiple times to create the feathers for the wings
    var objLoader = new THREE.OBJLoader();
    objLoader.load('/geo/feather.obj', function(obj) {
        for (var i = 0; i < numFeathers; i++) {
            // LOOK: This function runs after the obj has finished loading
            var featherGeo = obj.children[0].geometry;
            
            // Wing material: color interpolation
            var interpolateFactor = linearInterpolate(1, 0, i/numFeathers);
            var featherMaterial = new THREE.MeshPhongMaterial();
            featherMaterial.color.setRGB(interpolateFactor, 1, 1);

            var rightFeatherMesh = new THREE.Mesh(featherGeo, featherMaterial);
            rightFeatherMesh.name = "rightFeather" + i;
            var leftFeatherMesh = new THREE.Mesh(featherGeo, featherMaterial);
            leftFeatherMesh.name = "leftFeather" + i;

            // scale interpolation
            var scaleAmt = linearInterpolate(0.25, 1.0, i/numFeathers);
            rightFeatherMesh.scale.x = scaleAmt;
            rightFeatherMesh.scale.y = scaleAmt;
            rightFeatherMesh.scale.z = scaleAmt;
            leftFeatherMesh.scale.x = scaleAmt;
            leftFeatherMesh.scale.y = scaleAmt;
            leftFeatherMesh.scale.z = scaleAmt;

            // orientation interpolation
            var rightWingGeom = rightWingObject.geometry;
            rightFeatherMesh.position.set(rightWingGeom.vertices[i].x,rightWingGeom.vertices[i].y,rightWingGeom.vertices[i].z);
            var zRotateAmt = linearInterpolate(270, 360, i/numFeathers);
            rightFeatherMesh.rotateOnAxis(zAxis, degreesToRads(zRotateAmt));            
            var xRotateAmt = linearInterpolate(80, 90, i/numFeathers);
            rightFeatherMesh.rotateOnAxis(xAxis, degreesToRads(xRotateAmt));
            //rightFeatherMesh.rotateZ(degreesToRads(90));

            var leftWingGeom = leftWingObject.geometry;
            leftFeatherMesh.position.set(leftWingGeom.vertices[i].x,leftWingGeom.vertices[i].y,leftWingGeom.vertices[i].z);
            zRotateAmt = linearInterpolate(270, 180, i/numFeathers);
            leftFeatherMesh.rotateOnAxis(zAxis, degreesToRads(zRotateAmt));            
            leftFeatherMesh.rotateOnAxis(xAxis, degreesToRads(xRotateAmt));

            scene.add(rightFeatherMesh);
            scene.add(leftFeatherMesh);
        }
    });
}

function flutterWings(numFeathers, scene) {
    for (var i = 0; i < numFeathers; i++) {
        var date = new Date();
        var rightFeather = scene.getObjectByName("rightFeather"+i);
        var leftFeather = scene.getObjectByName("leftFeather"+i);
        if (leftFeather !== undefined && rightFeather !== undefined) {
            rightFeather.rotateY(Math.sin(date.getTime() / 100) * 2 * Math.PI / 1800);
            leftFeather.rotateY(Math.sin(date.getTime() / 100) * 2 * Math.PI / 1800);  
        } 
    }
}

// called on frame updates
function onUpdate(framework) {
    flutterWings(numFeathers, framework.scene);
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);