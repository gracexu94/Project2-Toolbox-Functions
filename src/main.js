
// Skybox texture from: https://github.com/mrdoob/three.js/tree/master/examples/textures/cube/skybox

const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function linearInterpolate(a, b, t) {
    return a * (1 - t) + b * t;
}

function degreesToRads(degrees) {
    return Math.PI / 180.0 * degrees;
}

var xAxis = new THREE.Vector3(1,0,0);
var yAxis = new THREE.Vector3(0,1,0);
var zAxis = new THREE.Vector3(0,0,1);
var guiVars = {
            flapWing: true,
            flapStrength: 1.0,
            flapSpeed: 200.0,
            flapMotion: 'sin',
            leftWingCurve_startPtX: -0.1,
            leftWingCurve_startPtY: 0.0,
            leftWingCurve_startPtZ: 0.0,
            leftWingCurve_Pt1X: -1.0,
            leftWingCurve_Pt1Y: 0.75,
            leftWingCurve_Pt1Z: 0.0,
            leftWingCurve_Pt2X: -2.0,
            leftWingCurve_Pt2Y: 3.0,
            leftWingCurve_Pt2Z: 0.0,
            leftWingCurve_endPtX: -5.0,
            leftWingCurve_endPtY: 2.0,
            leftWingCurve_endPtZ: 0.0,
            rightWingCurve_startPtX: 0.1,
            rightWingCurve_startPtY: 0.0,
            rightWingCurve_startPtZ: 0.0,
            rightWingCurve_Pt1X: 1.0,
            rightWingCurve_Pt1Y: 0.75,
            rightWingCurve_Pt1Z: 0.0,
            rightWingCurve_Pt2X: 2.0,
            rightWingCurve_Pt2Y: 3.0,
            rightWingCurve_Pt2Z: 0.0,
            rightWingCurve_endPtX: 5.0,
            rightWingCurve_endPtY: 2.0,
            rightWingCurve_endPtZ: 0.0,
            numFeathers: 45, 
            windStrength: 3.0, 
            featherSize: 1.0, 
            featherColorR_start: 0.0,
            featherColorG_start: 0.5,
            featherColorB_start: 1.0,
            featherColorR_end: 0.5,
            featherColorG_end: 1.0,
            featherColorB_end: 1.0,
            xRotationLocal_degrees: 0.0,
            yRotationLocal_degrees: 0.0,
            zRotationLocal_degrees: 0.0,
            xRotationGlobal_degrees: 0.0,
            yRotationGlobal_degrees: 0.0,
            zRotationGlobal_degrees: 0.0};

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
    rightWingGeom.vertices = rightWing.getPoints(guiVars.numFeathers);
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
    leftWingGeom.vertices = leftWing.getPoints(guiVars.numFeathers);

    var leftWingObject = new THREE.Line(leftWingGeom, lineMaterial);
    leftWingObject.name = "leftWingCurve";
    scene.add(leftWingObject);

    createWings(scene, rightWingObject, leftWingObject);

    // set camera position
    camera.position.set(0, 1, 5);
    camera.lookAt(new THREE.Vector3(0,0,0));
    scene.add(directionalLight);

    // edit params and listen to changes like this
    // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
    gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
        camera.updateProjectionMatrix();
    });
    gui.add(guiVars, 'windStrength', 0, 20);
    gui.add(guiVars, 'numFeathers', 20, 100).onChange(function(newVal) {
        removeWings(framework.scene);
        rightWingObject.geometry.vertices = rightWing.getPoints(newVal);
        leftWingObject.geometry.vertices = leftWing.getPoints(newVal);
        createWings(framework.scene, rightWingObject, leftWingObject);
    });
    gui.add(guiVars, 'featherSize', 0.5, 3.0).onChange(function(newVal) {
        removeWings(framework.scene);
        createWings(framework.scene, rightWingObject, leftWingObject);
    });

    var flapControls = gui.addFolder('Flapping controls');
    flapControls.add(guiVars, 'flapWing');
    flapControls.add(guiVars, 'flapStrength', 0.0, 50.0);
    flapControls.add(guiVars, 'flapSpeed', 50, 500.0);
    flapControls.add(guiVars, 'flapMotion', ['cosine', 'sin']);

    var rightCurveFolder = gui.addFolder('Right wing curve controls');
    rightCurveFolder.add(guiVars, 'rightWingCurve_startPtX', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedRightWing = updateRightWingCurve(framework.scene);
        createWings(framework.scene, updatedRightWing, leftWingObject);
    });
    rightCurveFolder.add(guiVars, 'rightWingCurve_startPtY', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedRightWing = updateRightWingCurve(framework.scene);
        createWings(framework.scene, updatedRightWing, leftWingObject);
    });
    rightCurveFolder.add(guiVars, 'rightWingCurve_startPtZ', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedRightWing = updateRightWingCurve(framework.scene);
        createWings(framework.scene, updatedRightWing, leftWingObject);
    });
    rightCurveFolder.add(guiVars, 'rightWingCurve_Pt1X', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedRightWing = updateRightWingCurve(framework.scene);
        createWings(framework.scene, updatedRightWing, leftWingObject);
    });
    rightCurveFolder.add(guiVars, 'rightWingCurve_Pt1Y', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedRightWing = updateRightWingCurve(framework.scene);
        createWings(framework.scene, updatedRightWing, leftWingObject);
    });
    rightCurveFolder.add(guiVars, 'rightWingCurve_Pt1Z', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedRightWing = updateRightWingCurve(framework.scene);
        createWings(framework.scene, updatedRightWing, leftWingObject);
    });
    rightCurveFolder.add(guiVars, 'rightWingCurve_Pt2X', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedRightWing = updateRightWingCurve(framework.scene);
        createWings(framework.scene, updatedRightWing, leftWingObject);
    });
    rightCurveFolder.add(guiVars, 'rightWingCurve_Pt2Y', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedRightWing = updateRightWingCurve(framework.scene);
        createWings(framework.scene, updatedRightWing, leftWingObject);
    });
    rightCurveFolder.add(guiVars, 'rightWingCurve_Pt2Z', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedRightWing = updateRightWingCurve(framework.scene);
        createWings(framework.scene, updatedRightWing, leftWingObject);
    });
    rightCurveFolder.add(guiVars, 'rightWingCurve_endPtX', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedRightWing = updateRightWingCurve(framework.scene);
        createWings(framework.scene, updatedRightWing, leftWingObject);
    });
    rightCurveFolder.add(guiVars, 'rightWingCurve_endPtY', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedRightWing = updateRightWingCurve(framework.scene);
        createWings(framework.scene, updatedRightWing, leftWingObject);
    });
    rightCurveFolder.add(guiVars, 'rightWingCurve_endPtZ', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedRightWing = updateRightWingCurve(framework.scene);
        createWings(framework.scene, updatedRightWing, leftWingObject);
    });

    var leftCurveFolder = gui.addFolder('Left wing curve controls');
    leftCurveFolder.add(guiVars, 'leftWingCurve_startPtX', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedLeftWing = updateLeftWingCurve(framework.scene);
        createWings(framework.scene, rightWingObject, updatedLeftWing);
    });
    leftCurveFolder.add(guiVars, 'leftWingCurve_startPtY', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedLeftWing = updateLeftWingCurve(framework.scene);
        createWings(framework.scene, rightWingObject, updatedLeftWing);
    });
    leftCurveFolder.add(guiVars, 'leftWingCurve_startPtZ', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedLeftWing = updateLeftWingCurve(framework.scene);
        createWings(framework.scene, rightWingObject, updatedLeftWing);
    });
    leftCurveFolder.add(guiVars, 'leftWingCurve_Pt1X', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedLeftWing = updateLeftWingCurve(framework.scene);
        createWings(framework.scene, rightWingObject, updatedLeftWing);
    });
    leftCurveFolder.add(guiVars, 'leftWingCurve_Pt1Y', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedLeftWing = updateLeftWingCurve(framework.scene);
        createWings(framework.scene, rightWingObject, updatedLeftWing);
    });
    leftCurveFolder.add(guiVars, 'leftWingCurve_Pt1Z', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedLeftWing = updateLeftWingCurve(framework.scene);
        createWings(framework.scene, rightWingObject, updatedLeftWing);
    });
    leftCurveFolder.add(guiVars, 'leftWingCurve_Pt2X', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedLeftWing = updateLeftWingCurve(framework.scene);
        createWings(framework.scene, rightWingObject, updatedLeftWing);
    });
    leftCurveFolder.add(guiVars, 'leftWingCurve_Pt2Y', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedLeftWing = updateLeftWingCurve(framework.scene);
        createWings(framework.scene, rightWingObject, updatedLeftWing);
    });
    leftCurveFolder.add(guiVars, 'leftWingCurve_Pt2Z', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedLeftWing = updateLeftWingCurve(framework.scene);
        createWings(framework.scene, rightWingObject, updatedLeftWing);
    });
    leftCurveFolder.add(guiVars, 'leftWingCurve_endPtX', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedLeftWing = updateLeftWingCurve(framework.scene);
        createWings(framework.scene, rightWingObject, updatedLeftWing);
    });
    leftCurveFolder.add(guiVars, 'leftWingCurve_endPtY', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedLeftWing = updateLeftWingCurve(framework.scene);
        createWings(framework.scene, rightWingObject, updatedLeftWing);
    });
    leftCurveFolder.add(guiVars, 'leftWingCurve_endPtZ', -10.0, 10.0).onChange(function(newVal) {
        removeWings(framework.scene);
        var updatedLeftWing = updateLeftWingCurve(framework.scene);
        createWings(framework.scene, rightWingObject, updatedLeftWing);
    });

    var colorFolder = gui.addFolder('Color controls');
    colorFolder.add(guiVars, 'featherColorR_start', 0.0, 1.0).onChange(function(newVal) {
        removeWings(framework.scene);
        createWings(framework.scene, rightWingObject, leftWingObject);
    });
    colorFolder.add(guiVars, 'featherColorR_end', 0.0, 1.0).onChange(function(newVal) {
        removeWings(framework.scene);
        createWings(framework.scene, rightWingObject, leftWingObject);
    });
    colorFolder.add(guiVars, 'featherColorG_start', 0.0, 1.0).onChange(function(newVal) {
        removeWings(framework.scene);
        createWings(framework.scene, rightWingObject, leftWingObject);
    });
    colorFolder.add(guiVars, 'featherColorG_end', 0.0, 1.0).onChange(function(newVal) {
        removeWings(framework.scene);
        createWings(framework.scene, rightWingObject, leftWingObject);
    });
    colorFolder.add(guiVars, 'featherColorB_start', 0.0, 1.0).onChange(function(newVal) {
        removeWings(framework.scene);
        createWings(framework.scene, rightWingObject, leftWingObject);
    });
    colorFolder.add(guiVars, 'featherColorB_end', 0.0, 1.0).onChange(function(newVal) {
        removeWings(framework.scene);
        createWings(framework.scene, rightWingObject, leftWingObject);
    });

    var orientationFolder = gui.addFolder('Feather orientation controls');
    orientationFolder.add(guiVars, 'xRotationLocal_degrees', 0.0, 360.0).onChange(function(newVal) {
        rotateWingsLocal(scene);
    });
    orientationFolder.add(guiVars, 'yRotationLocal_degrees', 0.0, 360.0).onChange(function(newVal) {
        rotateWingsLocal(scene);
    });
    orientationFolder.add(guiVars, 'zRotationLocal_degrees', 0.0, 360.0).onChange(function(newVal) {
        rotateWingsLocal(scene);
    });
    orientationFolder.add(guiVars, 'xRotationGlobal_degrees', 0.0, 360.0).onChange(function(newVal) {
        rotateWingsGlobal(scene);
    });
    orientationFolder.add(guiVars, 'yRotationGlobal_degrees', 0.0, 360.0).onChange(function(newVal) {
        rotateWingsGlobal(scene);
    });
    orientationFolder.add(guiVars, 'zRotationGlobal_degrees', 0.0, 360.0).onChange(function(newVal) {
        rotateWingsGlobal(scene);
    });
}

function updateRightWingCurve(scene) {
    var rightWingCurve = scene.getObjectByName("rightWingCurve");
    scene.remove(rightWingCurve);
    var newRightWing = new THREE.CubicBezierCurve3(
        new THREE.Vector3(guiVars.rightWingCurve_startPtX, guiVars.rightWingCurve_startPtY, guiVars.rightWingCurve_startPtZ),
        new THREE.Vector3(guiVars.rightWingCurve_Pt1X, guiVars.rightWingCurve_Pt1Y, guiVars.rightWingCurve_Pt1Z),
        new THREE.Vector3(guiVars.rightWingCurve_Pt2X, guiVars.rightWingCurve_Pt2Y, guiVars.rightWingCurve_Pt2Z),
        new THREE.Vector3(guiVars.rightWingCurve_endPtX, guiVars.rightWingCurve_endPtY, guiVars.rightWingCurve_endPtZ)
    );

    var rightWingGeom = new THREE.Geometry();
    rightWingGeom.vertices = newRightWing.getPoints(guiVars.numFeathers);
    var lineMaterial = new THREE.LineBasicMaterial();
    var rightWingObject = new THREE.Line(rightWingGeom, lineMaterial);
    rightWingObject.name = "rightWingCurve";
    scene.add(rightWingObject);
    return rightWingCurve;
}

function updateLeftWingCurve(scene) {
    var leftWingCurve = scene.getObjectByName("leftWingCurve");
    scene.remove(leftWingCurve);
    var newLeftWing = new THREE.CubicBezierCurve3(
        new THREE.Vector3(guiVars.leftWingCurve_startPtX, guiVars.leftWingCurve_startPtY, guiVars.leftWingCurve_startPtZ),
        new THREE.Vector3(guiVars.leftWingCurve_Pt1X, guiVars.leftWingCurve_Pt1Y, guiVars.leftWingCurve_Pt1Z),
        new THREE.Vector3(guiVars.leftWingCurve_Pt2X, guiVars.leftWingCurve_Pt2Y, guiVars.leftWingCurve_Pt2Z),
        new THREE.Vector3(guiVars.leftWingCurve_endPtX, guiVars.leftWingCurve_endPtY, guiVars.leftWingCurve_endPtZ)
    );

    var leftWingGeom = new THREE.Geometry();
    leftWingGeom.vertices = newLeftWing.getPoints(guiVars.numFeathers);
    var lineMaterial = new THREE.LineBasicMaterial();
    var leftWingObject = new THREE.Line(leftWingGeom, lineMaterial);
    leftWingObject.name = "leftWingCurve";
    scene.add(leftWingObject);
    return leftWingCurve;
}

function rotateWingsLocal(scene) {
    for (var i = 0; i < guiVars.numFeathers; i++) {
        var rightFeather = scene.getObjectByName("rightFeather"+i);
        var leftFeather = scene.getObjectByName("leftFeather"+i);
        if (leftFeather !== undefined && rightFeather !== undefined) {
            rightFeather.rotateX(degreesToRads(guiVars.xRotationLocal_degrees));
            leftFeather.rotateX(degreesToRads(guiVars.xRotationLocal_degrees)); 
            rightFeather.rotateY(degreesToRads(guiVars.yRotationLocal_degrees));
            leftFeather.rotateY(degreesToRads(guiVars.yRotationLocal_degrees)); 
            rightFeather.rotateZ(degreesToRads(guiVars.zRotationLocal_degrees));
            leftFeather.rotateZ(degreesToRads(guiVars.zRotationLocal_degrees));        
        } 
    }
}

function rotateWingsGlobal(scene) {
    for (var i = 0; i < guiVars.numFeathers; i++) {
        var rightFeather = scene.getObjectByName("rightFeather"+i);
        var leftFeather = scene.getObjectByName("leftFeather"+i);
        if (leftFeather !== undefined && rightFeather !== undefined) {
            rightFeather.rotateOnAxis(xAxis, degreesToRads(guiVars.xRotationGlobal_degrees));
            leftFeather.rotateOnAxis(xAxis, degreesToRads(guiVars.xRotationGlobal_degrees)); 
            rightFeather.rotateOnAxis(yAxis, degreesToRads(guiVars.yRotationGlobal_degrees));
            leftFeather.rotateOnAxis(yAxis, degreesToRads(guiVars.yRotationGlobal_degrees)); 
            rightFeather.rotateOnAxis(zAxis, degreesToRads(guiVars.zRotationGlobal_degrees));
            leftFeather.rotateOnAxis(zAxis, degreesToRads(guiVars.zRotationGlobal_degrees));        
        } 
    }
}

function removeWings(scene) {
    for (var i = 0; i < guiVars.numFeathers; i++) {
        var rightFeather = scene.getObjectByName("rightFeather"+i);
        scene.remove(rightFeather);
        var leftFeather = scene.getObjectByName("leftFeather"+i);
        scene.remove(leftFeather);
    }
}

function createWings(scene, rightWingObject, leftWingObject) {
    // load a simple obj mesh multiple times to create the feathers for the wings
    var objLoader = new THREE.OBJLoader();
    var numFeathers = guiVars.numFeathers;
    objLoader.load('/geo/feather.obj', function(obj) {
        for (var i = 0; i < numFeathers; i++) {
            // LOOK: This function runs after the obj has finished loading
            var featherGeo = obj.children[0].geometry;
            
            // Wing material: color interpolation
            var interpolateColorR = linearInterpolate(guiVars.featherColorR_start, guiVars.featherColorR_end, i/numFeathers);
            var interpolateColorG = linearInterpolate(guiVars.featherColorG_start, guiVars.featherColorG_end, i/numFeathers);
            var interpolateColorB = linearInterpolate(guiVars.featherColorB_start, guiVars.featherColorB_end, i/numFeathers);
            var featherMaterial = new THREE.MeshPhongMaterial();
            featherMaterial.color.setRGB(interpolateColorR, interpolateColorG, interpolateColorB);

            var rightFeatherMesh = new THREE.Mesh(featherGeo, featherMaterial);
            rightFeatherMesh.name = "rightFeather" + i;
            var leftFeatherMesh = new THREE.Mesh(featherGeo, featherMaterial);
            leftFeatherMesh.name = "leftFeather" + i;

            // scale interpolation
            var scaleAmt = linearInterpolate(0.25 * guiVars.featherSize, guiVars.featherSize, i/numFeathers);
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

function flutterWings(scene) {
    for (var i = 0; i < guiVars.numFeathers; i++) {
        var random = getRandomInt(0,2);
        var date = new Date();
        var rightFeather = scene.getObjectByName("rightFeather"+i);
        var leftFeather = scene.getObjectByName("leftFeather"+i);
        if (leftFeather !== undefined && rightFeather !== undefined) {
            if (random === 0) {
                rightFeather.rotateX(Math.sin(date.getTime() / 100) * guiVars.windStrength * Math.PI / 1800);
                leftFeather.rotateX(Math.sin(date.getTime() / 100) * guiVars.windStrength * Math.PI / 1800);        
            }
        } 
    }
}

// called on frame updates
function onUpdate(framework) {
    if (guiVars.flapWing) {
        removeWings(framework.scene);
        var date = new Date();
        var flapAmt = 0; 
        if (guiVars.flapMotion === 'sin') {
            flapAmt = Math.sin(date.getTime() / guiVars.flapSpeed) * Math.PI;
        } else if (guiVars.flapMotion === 'cosine') {
            flapAmt = Math.cos(date.getTime() / guiVars.flapSpeed) * Math.PI;
        }
      
        guiVars.leftWingCurve_Pt2Z = (flapAmt < 0) ? 0.0 : flapAmt;
        guiVars.rightWingCurve_Pt2Z = (flapAmt < 0) ? 0.0 : flapAmt;
        guiVars.leftWingCurve_endPtZ =  flapAmt * guiVars.flapStrength;
        guiVars.rightWingCurve_endPtZ = flapAmt * guiVars.flapStrength;

        var updatedLeftWing = updateLeftWingCurve(framework.scene);
        var updatedRightWing = updateRightWingCurve(framework.scene);
        createWings(framework.scene, updatedRightWing, updatedLeftWing);
    }
    flutterWings(framework.scene);
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);