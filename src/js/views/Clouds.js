import * as THREE from 'three'
import CloudMap from 'views/CloudMap.js'
import tinycolor from 'tinycolor2'

class Clouds {

  constructor() {
    this.view = new THREE.Object3D();

    this.materials = [];
    this.roughness = 0.9;
    this.metalness = 0.5;
    this.normalScale = 5.0;
    this.clouds = 1.0;


    this.resolution = 1024;
    this.size = 1001;


    this.color = new THREE.Color(0xffffffff);

    this.cloudColor = [this.color.r*255, this.color.g*255, this.color.b*255];

    this.cloudMaps = [];

    this.setup();


    let cloudControl = window.gui.add(this, "clouds", 0.0, 1.0);
    cloudControl.onChange(value => { this.updateMaterial(); });

    let colorControl = window.gui.addColor(this, "cloudColor");
    colorControl.onChange(value => {
      this.color.r = value[0] / 255;
      this.color.g = value[1] / 255;
      this.color.b = value[2] / 255;
      this.updateMaterial();
    });

  }

  update() {
    //
  }

  setup() {

    this.cloudMap = new CloudMap();
    this.cloudMaps = this.cloudMap.maps;

    for (let i=0; i<6; i++) {
      let material = new THREE.MeshStandardMaterial({
        color: this.color,
        transparent: true,
      });
      this.materials[i] = material;
    }

    let geo = new THREE.BoxGeometry(1, 1, 1, 64, 64, 64);
    let radius = this.size;
    for (var i in geo.vertices) {
  		var vertex = geo.vertices[i];
  		vertex.normalize().multiplyScalar(radius);
  	}
    this.computeGeometry(geo);
    this.sphere = new THREE.Mesh(geo, this.materials);
    this.view.add(this.sphere);
  }

  render(props, genSetting) {
    //let cloudSize = this.randRange(0.5, 1.0);
    let mixScale = this.map_range(props.waterLevel*props.waterLevel, 0, 0.8, 0.0, 3.0);

    this.cloudMap.render({
      seed: genSetting.seed,
      resolution: this.resolution,
      res1: genSetting.cloudMap.res1,
      res2: genSetting.cloudMap.res2,
      resMix: genSetting.cloudMap.resMix,
      mixScale: genSetting.cloudMap.mixScale
    });

    this.updateMaterial();
  }

  map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
  }

  updateMaterial() {
    for (let i=0; i<6; i++) {
      let material = this.materials[i];
      material.roughness = this.roughness;
      material.metalness = this.metalness;
      material.opacity = this.clouds;
      material.map = this.cloudMaps[i];
      // material.alphaMap = this.cloudMaps[i],
      // material.bumpMap = this.cloudMaps[i],
      // material.bumpScale = 1.0,
      material.color = this.color;
    }
  }

  computeGeometry(geometry) {
  	// geometry.makeGroups();
  	geometry.computeVertexNormals()
  	geometry.computeFaceNormals();
  	geometry.computeMorphNormals();
  	geometry.computeBoundingSphere();
  	geometry.computeBoundingBox();
  	// geometry.computeLineDistances();

  	geometry.verticesNeedUpdate = true;
  	geometry.elementsNeedUpdate = true;
  	geometry.uvsNeedUpdate = true;
  	geometry.normalsNeedUpdate = true;
  	// geometry.tangentsNeedUpdate = true;
  	geometry.colorsNeedUpdate = true;
  	geometry.lineDistancesNeedUpdate = true;
  	// geometry.buffersNeedUpdate = true;
  	geometry.groupsNeedUpdate = true;
  }

}

export default Clouds;
