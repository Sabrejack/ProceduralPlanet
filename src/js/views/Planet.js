import * as THREE from 'three'
import Biome from 'views/Biome'
import Atmosphere from 'views/Atmosphere.js'
import NoiseMap from 'views/NoiseMap.js'
import TextureMap from 'views/TextureMap.js'
import NormalMap from 'views/NormalMap.js'
import RoughnessMap from 'views/RoughnessMap.js'
import TemperatureMap from 'views/TemperatureMap.js'
import Clouds from 'views/Clouds.js'
import Stars from 'views/Stars.js'
import Nebula from 'views/Nebula.js'
import Sun from 'views/Sun.js'
import Glow from 'views/Glow.js'
import NebulaeGradient from 'views/NebulaeGradient.js'
import seedrandom from 'seedrandom'
import randomString from 'crypto-random-string'
import AtmosphereRing from 'views/AtmosphereRing.js'
import randomLorem from 'random-lorem'
import UqmPlanetTable from '../UqmPlanetTable.js'


class Planet {

  constructor() {

    this.NON_UQM_PLANET = "NONE";

    this.seedString = "Scarlett";
    this.initSeed();

    this.view = new THREE.Object3D();

    this.materials = [];
    this.roughness = 0.8;
    this.metalness = 0.5;
    this.normalScale = 1.0;
    this.resolution = 1024;
    this.size = 1000;
    this.waterLevel = 0.0;

    this.pole1Factor = 2;
    this.pole2Factor = 2;
    this.heightFactor = 5;
    this.iciness = 0.7;
    this.iceCutoff = 0.1;

    this.uqmPlanetTable = new UqmPlanetTable();
    this.uqmPlanetTypes = this.uqmPlanetTable.getAllTypeNames();
    let nonechoice = [ this.NON_UQM_PLANET ];
    let choicelist = nonechoice.concat(this.uqmPlanetTypes);
    this.uqmPlanetTypeChoices = choicelist;
    this.uqmPlanetType = this.NON_UQM_PLANET;
    this.uqmPlanetSeedChoices = [];
    this.uqmPlanetSeedChoice = "NONE";

    // this.waterLevel = 0.5;

    this.heightMaps = [];
    this.moistureMaps = [];
    this.textureMaps = [];
    this.normalMaps = [];
    this.roughnessMaps = [];
    this.temperatureMaps = [];

    let matFolder = gui.addFolder('Material');

    this.roughnessControl = matFolder.add(this, "roughness", 0.0, 1.0);
    this.roughnessControl.onChange(value => { this.updateMaterial(); });

    this.metalnessControl = matFolder.add(this, "metalness", 0.0, 1.0);
    this.metalnessControl.onChange(value => { this.updateMaterial(); });

    this.normalScaleControl = matFolder.add(this, "normalScale", -3.0, 6.0).listen();
    this.normalScaleControl.onChange(value => { this.updateMaterial(); });

    let biomeFolder = gui.addFolder('Biome Controls');

    this.pole1FactorControl = biomeFolder.add(this, "pole1Factor", 0.0, 5.0);
    this.pole1FactorControl.onChange(value => { this.updateMaterial(); this.renderTemperatureMap(); this.renderTextureMap(); });

    this.pole2FactorControl = biomeFolder.add(this, "pole2Factor", 0.0, 5.0);
    this.pole2FactorControl.onChange(value => { this.updateMaterial(); this.renderTemperatureMap(); this.renderTextureMap();});

    this.heightFactorControl = biomeFolder.add(this, "heightFactor", 0.0, 10.0);
    this.heightFactorControl.onChange(value => { this.updateMaterial(); this.renderTemperatureMap(); this.renderTextureMap();});

    this.icinessControl = biomeFolder.add(this, "iciness", 0.0, 1.0);
    this.icinessControl.onChange(value => { this.updateMaterial(); this.renderTemperatureMap(); this.renderTextureMap();});

    //this.iceCutoff = biomeFolder.add(this, "iceCutoff", 0.0, 1.0);
    //this.iceCutoff.onChange(value => { this.updateMaterial(); this.renderTemperatureMap(); });

    // debug options
    this.displayMap = "textureMap";
    let debugFolder = gui.addFolder('Debug');
    this.displayMapControl = debugFolder.add(this, "displayMap", ["textureMap", "heightMap", "moistureMap", "normalMap", "roughnessMap", "temperatureMap"]);
    this.displayMapControl.onChange(value => { this.updateMaterial(); });

    this.showBiomeMap = false;
    this.showBiomeMapControl = debugFolder.add(this, "showBiomeMap");
    this.showBiomeMapControl.onChange(value => {
      if (this.biome) {
        this.biome.toggleCanvasDisplay(value);
      }
     });

     this.showNebulaMap = false;
     this.showNebulaMapControl = debugFolder.add(this, "showNebulaMap");
     this.showNebulaMapControl.onChange(value => {
       if (this.nebulaeGradient) {
         this.nebulaeGradient.toggleCanvasDisplay(value);
       }
      });




    this.biome = new Biome();
    this.nebulaeGradient = new NebulaeGradient();

    this.createScene();
    this.createStars();
    this.createNebula();
    this.createSun();
    // this.createClouds();
    // this.createGlow();

    // this.atmosphereRing = new AtmosphereRing();
    // this.view.add(this.atmosphereRing.view);

    this.createAtmosphere();
    this.loadSeedFromURL();


    ////////////////// environment gui
    let enviromentFolder = gui.addFolder('Environment');
    enviromentFolder.add(this.atmosphere, "atmosphere", 0.0, 1.0).step(0.01);
    enviromentFolder.add(this.nebula, "nebula", 0.0, 1.0).step(0.01).onChange(value => {
      this.nebula.updateMaterial();
    });


    this.rotate = true;
    this.autoGenerate = false;
    this.autoGenCountCurrent = 0;
    this.autoGenTime = 3*60;
    this.autoGenCountMax = this.autoGenTime * 60;

    window.gui.add(this, "rotate");

    this.resolutionControl = window.gui.add(this, "resolution", [256, 512, 1024, 2048, 4096]);
    this.resolutionControl.onChange(value => { this.regenerate(); });

    debugFolder.add(this, "autoGenerate");
    this.autoGenTimeControl = debugFolder.add(this, "autoGenTime", 30, 300).step(1);
    this.autoGenTimeControl.onChange(value => { this.autoGenCountMax = this.autoGenTime * 60 });

    this.seedStringControl = window.gui.add(this, "seedString").listen();
    this.seedStringControl.onFinishChange(value => { this.loadSeedFromTextfield(); });
    window.gui.add(this, "randomize");

    this.uqmPlanetTypeControl = window.gui.add(this, "uqmPlanetType", this.uqmPlanetTypeChoices, );
    this.uqmPlanetTypeControl.onFinishChange(value => { this.pickPlanetType(); });

    document.addEventListener('keydown', (event) => {
      if (event.target.nodeName != 'BODY') {
        return;
      }

      if (event.keyCode == 32) {
        this.randomize();
      }
    });

    window.onpopstate = (event) => {
      this.loadSeedFromURL();
    };

    this.renderUI();

  }

  update() {
    if (this.rotate) {
      this.ground.rotation.y += 0.0005;
      this.stars.view.rotation.y += 0.0003;
      this.nebula.view.rotation.y += 0.0003;
      // this.clouds.view.rotation.y += 0.0007;
    }

    this.atmosphere.update();



    // this.glow.update();

    if (this.autoGenerate) {
      this.autoGenCountCurrent++;
      if (this.autoGenCountCurrent > this.autoGenCountMax) {
        this.randomize();
      }
    }

    this.stars.view.position.copy(window.camera.position);
    this.nebula.view.position.copy(window.camera.position);

    // this.atmosphereRing.update();

  }

  renderUI(){
    let infoBoxHolder = document.createElement("div");
    infoBoxHolder.setAttribute("id", "infoBoxHolder");
    document.body.appendChild(infoBoxHolder);

    let infoBox = document.createElement("div");
    infoBox.setAttribute("id", "infoBox");
    infoBox.innerHTML = "Planet<br><div id='planetName'></div><br><div id='instructions'>H - Show/Hide UI<br>SPACEBAR - New Planet</div>";
    infoBoxHolder.appendChild(infoBox);

    let line = document.createElement("div");
    line.setAttribute("id", "line");
    infoBoxHolder.appendChild(line);
    infoBoxHolder.appendChild(window.gui.domElement);

    let creditsBox = document.createElement("div");
    creditsBox.setAttribute("id", "creditsBox");
    creditsBox.innerHTML = `
      Forked from <a href="https://github.com/colordodge/ProceduralPlanet">ProceduralPlanet</a> by <a href="https://github.com/colordodge">colordodge</a>.<br>
      Fonts from <a href="https://github.com/JHGuitarFreak/UQM-MegaMod">UQM MegaMod</a> by <a href="https://github.com/JHGuitarFreak">JHGuitarFreak</a>.
      `;
    document.body.appendChild(creditsBox);

    // mobile info box
    let mobileInfoBox = document.createElement("div");
    mobileInfoBox.setAttribute("id", "infoBoxHolderMobile");
    mobileInfoBox.innerHTML = "<div id='infoBoxMobile'>Planet<br><div id='planetNameMobile'></div></div>";
    document.body.appendChild(mobileInfoBox);

    this.updatePlanetName();

    // new planet button
    let newPlanetButtonHolder = document.createElement("div");
    newPlanetButtonHolder.setAttribute("id", "newPlanetButtonHolder");
    newPlanetButtonHolder.innerHTML = "<div id='newPlanetButton'>New Planet</div>";
    document.body.appendChild(newPlanetButtonHolder);

    let newPlanetButton = document.getElementById("newPlanetButton");
    newPlanetButton.addEventListener('click', (e) => {this.randomize()} );
  }

  updatePlanetName() {
    let planetName = document.getElementById("planetName");
    if (planetName != null) {
      planetName.innerHTML = this.seedString;
    }

    let planetNameMobile = document.getElementById("planetNameMobile");
    if (planetNameMobile != null) {
      planetNameMobile.innerHTML = this.seedString;
    }
  }

  initSeed() {
    window.rng = seedrandom(this.seedString);
  }

  loadSeedFromURL() {
    this.seedString = this.getParameterByName("seed");
    if (this.seedString) {
      console.log("seed string exists");
      this.regenerate();
    } else {
      console.log("no seed string");
      this.randomize(true);
    }

  }

  loadSeedFromTextfield() {
    let url = this.updateQueryString("seed", this.seedString);
    window.history.pushState({seed: this.seedString}, this.seedString, url);
    this.regenerate();
  }

  regenerate() {
    this.autoGenCountCurrent = 0;
    this.renderScene();
  }

  randomize(use_uqm_table = false) {
    // this.seedString = randomString(10);

    if (!use_uqm_table) {
      let n = Math.random();
      let wordCount = 0;
      if (n > 0.8) wordCount = 1;
      else if (n > 0.4) wordCount = 2;
      else wordCount = 3;
  
      this.seedString = "";
      for (let i=0; i<wordCount; i++) {
        this.seedString += this.capitalizeFirstLetter(randomLorem({ min: 2, max: 8 }));
        if (i < wordCount-1) this.seedString += " ";
      }

      this.clearPickPlanetSeedUI();
    } else {
      let type = this.uqmPlanetType == "NONE"
        ? this.uqmPlanetTable.getRandomPlanetType()
        : this.uqmPlanetTable.findPlanetTypeByName(this.uqmPlanetType);

      let seeds = type.seeds;
      this.seedString = seeds[Math.floor(Math.random() * seeds.length)];
    }

    // this.seedString = randomLorem({ min: 2, max: 8 });
    // this.seedString += " " + randomLorem({ min: 2, max: 8 });
    let url = this.updateQueryString("seed", this.seedString);
    window.history.pushState({seed: this.seedString}, this.seedString, url);
    this.autoGenCountCurrent = 0;
    this.renderScene();
  }

  randomizeUqm() {
    this.randomize(1);
    this.uqmPlanetSeedChoice = this.seedString;
    
    if (this.uqmPlanetSeedChoiceControl != null) {
      this.uqmPlanetSeedChoiceControl.updateDisplay();
    }
  }

  pickPlanetType() {
    let typeString = this.uqmPlanetType;
    let type = this.UQM_PLANETTABLE.find(m => m.type == this.uqmPlanetType);

    if (type != null) {
      this.uqmPlanetSeedChoices = type.seeds;
      this.uqmPlanetSeedChoice = type.seeds[0];
    } else {
      this.uqmPlanetSeedChoices = [];
      this.uqmPlanetSeedChoice = "NONE";
    }
//    console.log(this.uqmPlanetSeedChoices);
//    console.log(this.uqmPlanetSeedChoice);

    if (this.uqmPlanetSeedChoiceControl != null) {
      window.gui.remove(this.uqmPlanetSeedChoiceControl);
      this.uqmPlanetSeedChoiceControl = null;
    }
    if (this.randomizeUqmButton != null) {
      window.gui.remove(this.randomizeUqmButton);
      this.randomizeUqmButton = null;
    }
    
    if (typeString != this.NON_UQM_PLANET) {
      this.uqmPlanetSeedChoiceControl = window.gui.add(this, "uqmPlanetSeedChoice", this.uqmPlanetSeedChoices );
      this.uqmPlanetSeedChoiceControl.onFinishChange(value => { this.pickPlanetSeed(); });
      this.randomizeUqmButton = window.gui.add(this, "randomizeUqm");
    }

    if (this.uqmPlanetSeedChoice != "NONE") {
      this.pickPlanetSeed();
    } else {
      this.randomizeUqm();
    }
  }

  clearPickPlanetSeedUI() {
    this.uqmPlanetSeedChoices = [];
    this.uqmPlanetSeedChoice = "NONE";

    if (this.uqmPlanetSeedChoiceControl != null) {
      window.gui.remove(this.uqmPlanetSeedChoiceControl);
      this.uqmPlanetSeedChoiceControl = null;
   }
    if (this.randomizeUqmButton != null) {
      window.gui.remove(this.randomizeUqmButton);
      this.randomizeUqmButton = null;
    }

    if (this.uqmPlanetTypeControl != null) {
      this.uqmplanetType = this.NON_UQM_PLANET;
      this.uqmPlanetTypeControl.updateDisplay()
    }
  }

  pickPlanetSeed() {
    this.seedString = this.uqmPlanetSeedChoice;
    if (this.uqmPlanetSeedChoice = "") {
      this.randomizeUqm();
    } else {
      let url = this.updateQueryString("seed", this.seedString);
      window.history.pushState({seed: this.seedString}, this.seedString, url);
      this.autoGenCountCurrent = 0;
      this.renderScene();
    }
  }

  getUqmPlanetTypes() {
    let table = this.UQM_PLANETTABLE;
    let types = [];
    for (let i = 0; i < table.length; i++) {
      types.push(table[i].type);
    }
    return types;
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }


  createScene() {
    this.heightMap = new NoiseMap();
    this.heightMaps = this.heightMap.maps;

    this.moistureMap = new NoiseMap();
    this.moistureMaps = this.moistureMap.maps;

    this.temperatureMap = new TemperatureMap();
    this.temperatureMaps = this.temperatureMap.maps;

    this.textureMap = new TextureMap();
    this.textureMaps = this.textureMap.maps;

    this.normalMap = new NormalMap();
    this.normalMaps = this.normalMap.maps;

    this.roughnessMap = new RoughnessMap();
    this.roughnessMaps = this.roughnessMap.maps;

    for (let i=0; i<6; i++) {
      let material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xFFFFFF)
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
    this.ground = new THREE.Mesh(geo, this.materials);
    this.view.add(this.ground);
  }


  renderScene() {

    this.initSeed();
    this.updatePlanetName();

    this.seed = this.randRange(0, 1) * 1000.0;
    this.waterLevel = this.randRange(0.1, 0.5);
    // this.clouds.resolution = this.resolution;

    this.updateNormalScaleForRes(this.resolution);
    this.renderNebulaeGradient();

    this.stars.resolution = this.resolution;
    this.nebula.resolution = this.resolution;
    this.atmosphere.randomizeColor();
    // this.clouds.randomizeColor();
    // this.clouds.color = this.atmosphere.color;

    window.renderQueue.start();

    let resMin = 0.01;
    let resMax = 5.0;

    this.heightMap.render({
      seed: this.seed,
      resolution: this.resolution,
      res1: this.randRange(resMin, resMax),
      res2: this.randRange(resMin, resMax),
      resMix: this.randRange(resMin, resMax),
      mixScale: this.randRange(0.5, 1.0),
      doesRidged: Math.floor(this.randRange(0, 4))
      // doesRidged: 1
    });

    let resMod = this.randRange(3, 10);
    resMax *= resMod;
    resMin *= resMod;

    this.moistureMap.render({
      seed: this.seed + 392.253,
      resolution: this.resolution,
      res1: this.randRange(resMin, resMax),
      res2: this.randRange(resMin, resMax),
      resMix: this.randRange(resMin, resMax),
      mixScale: this.randRange(0.5, 1.0),
      doesRidged: Math.floor(this.randRange(0, 4))
      // doesRidged: 0
    });

    this.normalMap.render({
      resolution: this.resolution,
      waterLevel: this.waterLevel,
      heightMaps: this.heightMaps,
      textureMaps: this.textureMaps
    });

    this.roughnessMap.render({
      resolution: this.resolution,
      heightMaps: this.heightMaps,
      waterLevel: this.waterLevel,
      landRoughness: 0.75,
      waterRoughness: 0.9
    });

    this.renderTemperatureMap();

    this.renderBiomeTexture();

    this.renderTextureMap();
    
    // this.clouds.render({
    //   waterLevel: this.waterLevel
    // });

    this.stars.render({
      nebulaeMap: this.nebulaeGradient.texture
    });

    this.nebula.render({
      nebulaeMap: this.nebulaeGradient.texture
    });

    this.sun.render();


    window.renderQueue.addCallback(() => {
      this.updateMaterial();
    });
  }

  updateMaterial() {
    for (let i=0; i<6; i++) {
      let material = this.materials[i];
      material.roughness = this.roughness;
      material.metalness = this.metalness;

      if (this.displayMap == "textureMap") {
        material.map = this.textureMaps[i];
        material.normalMap = this.normalMaps[i];
        material.normalScale = new THREE.Vector2(this.normalScale, this.normalScale);
        material.roughnessMap = this.roughnessMaps[i];
        // material.metalnessMap = this.roughnessMaps[i];
      }
      else if (this.displayMap == "heightMap") {
        material.map = this.heightMaps[i];
        material.normalMap = null;
        material.roughnessMap = null;
      }
      else if (this.displayMap == "moistureMap") {
        material.map = this.moistureMaps[i];
        material.normalMap = null;
        material.roughnessMap = null;
      }
      else if (this.displayMap == "normalMap") {
        material.map = this.normalMaps[i];
        material.normalMap = null;
        material.roughnessMap = null;
      }
      else if (this.displayMap == "roughnessMap") {
        material.map = this.roughnessMaps[i];
        material.normalMap = null;
        material.roughnessMap = null;
      }
      else if (this.displayMap == "temperatureMap") {
        material.map = this.temperatureMaps[i];
        material.normalMap = null;
        material.roughnessMap = null;
      }

      material.needsUpdate = true;
    }
  }

  renderBiomeTexture() {
    this.biome.generateTexture({waterLevel: this.waterLevel});
  }

  renderNebulaeGradient() {
    this.nebulaeGradient.generateTexture();
  }

  renderTemperatureMap() {
    this.temperatureMap.render({
      resolution: this.resolution,
      heightMaps: this.heightMaps,
      pole1Factor: this.pole1Factor,
      pole2Factor: this.pole2Factor,
      heightFactor: this.heightFactor,
      iciness: this.iciness
    })
  }

  renderTextureMap() {
    this.textureMap.render({
      resolution: this.resolution,
      heightMaps: this.heightMaps,
      moistureMaps: this.moistureMaps,
      biomeMap: this.biome.texture,
      temperatureMaps: this.temperatureMaps,
      iceCutoff: 0.1
    });
  }

  createAtmosphere() {
    this.atmosphere = new Atmosphere();
    // this.atmosphere.color = this.glow.color;
    this.view.add(this.atmosphere.view);
  }

  createGlow() {
    this.glow = new Glow();
    // this.glow.color = this.atmosphere.color;
    this.view.add(this.glow.view);
  }

  createClouds() {
    this.clouds = new Clouds();
    this.view.add(this.clouds.view);
  }

  createStars() {
    this.stars = new Stars();
    this.view.add(this.stars.view);
  }

  createNebula() {
    this.nebula = new Nebula();
    this.view.add(this.nebula.view);
  }

  createSun() {
    this.sun = new Sun();
    this.view.add(this.sun.view);
  }

  updateNormalScaleForRes(value) {
    if (value == 256) this.normalScale = 0.25;
    if (value == 512) this.normalScale = 0.5;
    if (value == 1024) this.normalScale = 1.0;
    if (value == 2048) this.normalScale = 1.5;
    if (value == 4096) this.normalScale = 3.0;
  }

  randRange(low, high) {
    let range = high - low;
    let n = window.rng() * range;
    return low + n;
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

  updateQueryString(key, value, url) {
    if (!url) url = window.location.href;
    var re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi"),
        hash;

    if (re.test(url)) {
        if (typeof value !== 'undefined' && value !== null)
            return url.replace(re, '$1' + key + "=" + value + '$2$3');
        else {
            hash = url.split('#');
            url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
            if (typeof hash[1] !== 'undefined' && hash[1] !== null)
                url += '#' + hash[1];
            return url;
        }
    }
    else {
        if (typeof value !== 'undefined' && value !== null) {
            var separator = url.indexOf('?') !== -1 ? '&' : '?';
            hash = url.split('#');
            url = hash[0] + separator + key + '=' + value;
            if (typeof hash[1] !== 'undefined' && hash[1] !== null)
                url += '#' + hash[1];
            return url;
        }
        else
            return url;
    }
  }

  getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

}

export default Planet;
