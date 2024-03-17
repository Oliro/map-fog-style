import { Component, OnInit } from '@angular/core';

import * as L from 'leaflet';
import 'leaflet.heat';
import * as turf from '@turf/turf';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

  private map!: L.Map;
  public heatMap!: L.HeatLayer;
  private watchId!: number;

  public coordinatesArray: any[] = [];
  public polyline: any;
  public polylineBorder: any;

  public displacementLimit = 10; // Limite de deslocamento máximo em metros
  public speedLimit = 5; // Limite de velocidade máxima em metros por segundo
  public accelerationLimit = 20; // Limite de aceleração máxima em metros por segundo ao quadrado
  public timeInterval = 500; // Intervalo de tempo entre leituras de GPS em milissegundos

  public lastPosition: any = null;
  public lastSpeed: number = 0;
  public lastTimestamp: number = 0;
  public speed!: number;

  public totalDistance: number = 0;
  public pointIcon: any;

  public totalAreaExplored: any;

  public pontos: number = 0;
  public mensagem = '0-Inicio';

  ngOnInit(): void {
    this.createMap();
  }

  createMap() {

    this.map = L.map('map').setView([0, 0], 1);

    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 0,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    this.polyline = L.polyline([], { color: '#C4EEF2', weight: 7, opacity: 1 }).addTo(this.map);
    this.polylineBorder = L.polyline([], { color: '#025159', weight: 4 }).addTo(this.map);
    this.heatMap = L.heatLayer([], { radius: 8 });

    tiles.addTo(this.map);
    this.polyline.addTo(this.map);
    this.polylineBorder.addTo(this.map);
    this.heatMap.addTo(this.map)

    this.geoJsonDrawLimit();

    setTimeout(() => {
      this.zoneToExplore();
    }, 3000);

  }

  startTracking() {

    let firstPointView: boolean = false;

    if (navigator.geolocation) {
      const options = { enableHighAccuracy: true, timeout: 100, maximumAge: 0 };
      this.watchId = navigator.geolocation.watchPosition((position) => {

        this.updateCoordinates(position);

        const currentCoordenate = [position.coords.latitude, position.coords.longitude];

        if (!firstPointView) {
          this.updateCurrentViewPoint(currentCoordenate)
          firstPointView = true;
        }

      }, (error) => error, options);

    } else {
      alert("Navegador não suportado")
    }
  }

  updateCurrentViewPoint(currentPoint: any) {
    this.map.flyTo(currentPoint, 18, {
      duration: 2,
      easeLinearity: 0.25,
      animate: true
    });
  }

  stopTracking() {
    navigator.geolocation.clearWatch(this.watchId)

    if (this.pointIcon) {
      this.map.removeLayer(this.pointIcon);
    }

    this.pointIcon = L.icon({ iconUrl: 'assets/icons/finish.png', iconSize: [32, 32] });
    L.marker(this.coordinatesArray[this.coordinatesArray.length - 1], { icon: this.pointIcon }).addTo(this.map).bindPopup("Chagada");
  }

  updateCoordinates(position: any) {
    // debugger
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const currentTime = position.timestamp;

    if (this.lastPosition && this.lastTimestamp) {

      this.pontos++
      this.mensagem = 'criando novos pontos - ' + this.pontos + ' - accuracy= ' + position.coords.accuracy + ' metros';

      // Calcular o deslocamento entre a posição atual e a posição anterior
      const distancia = this.calculateDistanceHaversinesFormula(latitude, longitude, this.lastPosition.coords.latitude, this.lastPosition.coords.longitude);
      // Calcular o intervalo de tempo entre as leituras de GPS
      const diferenca_tempo = currentTime - this.lastTimestamp;
      // Calcular a velocidade em metros por segundo
      const velocidade = distancia / diferenca_tempo * 1000;

      if (distancia <= this.displacementLimit && velocidade <= this.speedLimit && diferenca_tempo >= this.timeInterval) {
        this.addPathLine(latitude, longitude);
        this.totalDistance = this.calculateTotalDistanceLeafletMethod(this.polyline);
        this.calculeExploredArea(latitude, longitude)
      } else {
        console.log('Ponto descartado devido a filtros.');
        this.mensagem = 'Ponto descartado devido a filtros.'
      }
    } else {
      this.mensagem = "Cria primeiro ponto"
      this.addPathLine(latitude, longitude)
    }

    this.lastPosition = position;
    this.lastSpeed = this.speed;
    this.lastTimestamp = currentTime;

  }

  addPathLine(latitude: number, longitude: number) {
    this.polyline.addLatLng([latitude, longitude]);
    this.polylineBorder.addLatLng([latitude, longitude]);
    this.heatMap.addLatLng([latitude, longitude, 1]);
    this.coordinatesArray.push([latitude, longitude, 1]);
    this.createIcons()
  }

  createIcons() {
    const startIcon = L.icon({ iconUrl: 'assets/icons/start.png', iconSize: [32, 32] });
    L.marker(this.coordinatesArray[0], { icon: startIcon }).addTo(this.map).bindPopup("Inicio");

    if (this.pointIcon) {
      this.map.removeLayer(this.pointIcon);
    }

    const currentPointIcon = L.icon({ iconUrl: 'assets/icons/point.png', iconSize: [32, 32] });
    this.pointIcon = L.marker(this.coordinatesArray[this.coordinatesArray.length - 1], { icon: currentPointIcon }).addTo(this.map).bindPopup("Ponto");
  }

  calculateDistanceHaversinesFormula(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180; // Latitude 1 em radianos
    const φ2 = lat2 * Math.PI / 180; // Latitude 2 em radianos
    const Δφ = (lat2 - lat1) * Math.PI / 180; // Diferença de latitude em radianos
    const Δλ = (lon2 - lon1) * Math.PI / 180; // Diferença de longitude em radianos

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distancia = R * c; // Distância em metros

    return distancia;
  }

  calculateTotalDistanceLeafletMethod(polyline: any) {
    let totalDistance = 0;
    const latlngs = polyline.getLatLngs();
    for (let i = 0; i < latlngs.length - 1; i++) {
      totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
    }
    return totalDistance / 1000; // Convertendo para quilômetros
  }

  zoneToExplore() {

    const sizeZone: number = 50;

    const circle = L.circle([-23.234563600752985, -45.89585548053398], {
      color: '#FA7F08',
      fillColor: '#F24405',
      fillOpacity: 0.3,
      weight: 1,
      radius: sizeZone
    }).addTo(this.map);

    circle.bindPopup("Zona de trabalho = " + sizeZone * 2 + ' metros de diâmetro');

  }

  geoJsonDrawLimit() {
    const cityBoundaryLayer = L.geoJSON(this.geoJson(), {
      style: {
        fillColor: 'rgba(255, 0, 0, 0.5)', // Vermelho com 50% de transparência
        fillOpacity: 0,
        color: '#8C034E',
        weight: 2,
        opacity: 0.8
      }
    }).addTo(this.map);

    this.map.fitBounds(cityBoundaryLayer.getBounds());
  }

  calculeExploredArea(latitude: number, longitude: number) {
    // Verifica se o ponto está dentro da área total
    const point = turf.point([longitude, latitude]);
    const areaTotalFeature = this.geoJson().features[0]; // Vamos considerar apenas a primeira feature
    if (!areaTotalFeature) {
        return "Nenhuma área total definida";
    }
    const areaTotalPolygon = turf.polygon(areaTotalFeature.geometry.coordinates);
    if (!turf.booleanPointInPolygon(point, areaTotalPolygon)) {
        return "O ponto não está dentro da área total";
    }

    // Calcula a área total
    const areaTotalGeoJson = turf.area(areaTotalPolygon);

    // Calcula o buffer do caminho explorado
    const invertedCoordinatesArray = this.coordinatesArray.map(coord => [coord[1], coord[0]]);
    const lineString = turf.lineString(invertedCoordinatesArray);
    const buffer = turf.buffer(lineString, 0.001, { units: 'kilometers' });

    // Verifica se o buffer se sobrepõe à área total
    const intersection = turf.intersect(areaTotalPolygon, buffer);
    if (!intersection) {
        return "0%"; // Se não houver sobreposição, então não houve exploração
    }

    // Calcula a área explorada
    const areaPathExplored = turf.area(intersection);
    const totalAreaExplored = (areaPathExplored / areaTotalGeoJson) * 100;

    // Verifica se a área explorada ultrapassou 100%
    if (totalAreaExplored > 100) {
        return "A área explorada ultrapassou 100%";
    }

    console.log(totalAreaExplored.toFixed(2) + "%");
    return totalAreaExplored.toFixed(2) + "%";
}


  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  geoJson(): any {
    //return { "type": "Feature", "properties": { "id": "3549904", "name": "São José dos Campos", "description": "São José dos Campos" }, "geometry": { "type": "Polygon", "coordinates": [[[-45.8935553653, -22.8387144259], [-45.8905857800, -22.8441839066], [-45.8936525929, -22.8566262533], [-45.8896344202, -22.8574865583], [-45.8874790915, -22.8706260307], [-45.8884696398, -22.8753281658], [-45.8785766784, -22.8749768977], [-45.8705812192, -22.8708109625], [-45.8697315842, -22.8814542294], [-45.8632868641, -22.8922213335], [-45.8744321996, -22.9036959589], [-45.8771712916, -22.9142291663], [-45.8771308088, -22.9207943459], [-45.8839008925, -22.9295962918], [-45.8953321061, -22.9339016592], [-45.8939666088, -22.9404106616], [-45.8831766475, -22.9507096552], [-45.8874964693, -22.9572551126], [-45.8807118314, -22.9657760912], [-45.8901779092, -22.9716388455], [-45.8954050331, -22.9862156006], [-45.9176312906, -23.0003236059], [-45.9298065895, -23.0169757564], [-45.9322599292, -23.0204493146], [-45.9289821760, -23.0270181532], [-45.9319027668, -23.0303755187], [-45.9236433773, -23.0357673783], [-45.8849118023, -23.0091643412], [-45.8857249140, -23.0178399963], [-45.8791566405, -23.0279485290], [-45.8714390009, -23.0313078526], [-45.8702707555, -23.0319324462], [-45.8573921758, -23.0377642906], [-45.8523458534, -23.0447235487], [-45.8475194212, -23.0453186570], [-45.8421346152, -23.0412126680], [-45.8174173866, -23.0725557699], [-45.8033304914, -23.0890670188], [-45.7994100073, -23.1015049290], [-45.7923924108, -23.1072719037], [-45.7878267633, -23.1021732952], [-45.7869669639, -23.1113132203], [-45.7792139032, -23.1098546848], [-45.7786480865, -23.1151123515], [-45.7747037464, -23.1047828685], [-45.7708496238, -23.1147098342], [-45.7661366070, -23.1160177341], [-45.7648383701, -23.1105372990], [-45.7607635462, -23.1143175268], [-45.7568362177, -23.1111303993], [-45.7519274489, -23.1173997296], [-45.7561890390, -23.1186660764], [-45.7597823216, -23.1271926367], [-45.7558552704, -23.1348504944], [-45.7596248902, -23.1502366181], [-45.7564055462, -23.1576926085], [-45.7596903267, -23.1665943228], [-45.7541296386, -23.1752518536], [-45.7520879196, -23.1775214992], [-45.7506902607, -23.1924752278], [-45.7473566328, -23.1987189812], [-45.7417471966, -23.1986914063], [-45.7401099162, -23.2022405160], [-45.7373910803, -23.2163969881], [-45.7319350632, -23.2231327967], [-45.7207515766, -23.2381052257], [-45.7258426095, -23.2392588131], [-45.7302741475, -23.2390232305], [-45.7362997015, -23.2467293719], [-45.7408765085, -23.2452908520], [-45.7483293777, -23.2540009053], [-45.7535042643, -23.2531329313], [-45.7587770479, -23.2546833279], [-45.7631956884, -23.2510546604], [-45.7682627217, -23.2606360456], [-45.7744682996, -23.2608951029], [-45.7758002757, -23.2690737000], [-45.7890186083, -23.2814123288], [-45.7934947333, -23.2918478706], [-45.7936267449, -23.2918663802], [-45.8037663579, -23.2933061383], [-45.8111562416, -23.2887479506], [-45.8233178717, -23.2954342774], [-45.8346291081, -23.2933013751], [-45.8348179292, -23.2972563970], [-45.8473041737, -23.3066911664], [-45.8593038784, -23.3048844753], [-45.8691632043, -23.2979343503], [-45.8778401288, -23.2994046693], [-45.9039868454, -23.2945823735], [-45.9082855356, -23.2900192276], [-45.9124666624, -23.2762409742], [-45.9214231341, -23.2630256522], [-45.9315223333, -23.2567443301], [-45.9419767242, -23.2604608409], [-45.9490425225, -23.2587130951], [-45.9557087480, -23.2518766856], [-45.9634487063, -23.2450405661], [-45.9649128468, -23.2389679471], [-45.9637433454, -23.2362413724], [-45.9709139889, -23.2329021276], [-45.9647541215, -23.2311116244], [-45.9656913315, -23.2254462957], [-45.9610753973, -23.2249797655], [-45.9597943300, -23.2193974131], [-45.9550533658, -23.2209270252], [-45.9545656733, -23.2166656522], [-45.9494691477, -23.2157368065], [-45.9480197044, -23.2117691731], [-45.9545944068, -23.2039483524], [-45.9623289955, -23.2057255411], [-45.9651445054, -23.2033069503], [-45.9683437560, -23.2071775719], [-45.9681342325, -23.1988352733], [-45.9801043185, -23.2048082235], [-45.9810716605, -23.2017656894], [-45.9975376982, -23.1862378918], [-46.0084651371, -23.1942727904], [-46.0072387182, -23.1995322753], [-46.0190392853, -23.1976783800], [-46.0196971906, -23.2022714544], [-46.0316021182, -23.1901716822], [-46.0522650468, -23.1881844064], [-46.0547124705, -23.1842850611], [-46.0510011043, -23.1775090296], [-46.0535935516, -23.1757409621], [-46.0639389296, -23.1722817451], [-46.0740022297, -23.1799600396], [-46.0770123903, -23.1693195102], [-46.0924906461, -23.1705359019], [-46.1011342001, -23.1589471535], [-46.0913470374, -23.1428290250], [-46.0972260360, -23.1369753208], [-46.0950179199, -23.1325363604], [-46.1006761618, -23.1254048003], [-46.0929917868, -23.1199067771], [-46.1035634295, -23.1170193094], [-46.0995419298, -23.1089739729], [-46.1071885092, -23.0956291398], [-46.1046575757, -23.0841757110], [-46.0942149174, -23.0840732880], [-46.0904372235, -23.0784603548], [-46.0913867891, -23.0658103068], [-46.0759372143, -23.0368639214], [-46.0822218443, -23.0335569642], [-46.0804479557, -23.0252738723], [-46.0706124079, -23.0139682323], [-46.0711221181, -23.0080259792], [-46.0663012122, -22.9944420158], [-46.0702646951, -22.9933832689], [-46.0706774859, -22.9887520648], [-46.0817535010, -22.9849255673], [-46.0770452270, -22.9771626391], [-46.0667134842, -22.9797181288], [-46.0506804372, -22.9658620057], [-46.0508642767, -22.9398015330], [-46.0410630222, -22.9211457738], [-46.0441687825, -22.9057008940], [-46.0498980695, -22.9028669369], [-46.0513293016, -22.8958387576], [-46.0268848732, -22.8841807633], [-46.0079965025, -22.8887345927], [-46.0012352678, -22.8793055936], [-45.9916378808, -22.8770028628], [-45.9919076691, -22.8691070771], [-45.9760513172, -22.8649464674], [-45.9643867798, -22.8550847568], [-45.9597470902, -22.8571408043], [-45.9558581465, -22.8497974613], [-45.9499634093, -22.8454025341], [-45.9365010207, -22.8447631563], [-45.9243002733, -22.8313646497], [-45.9221349488, -22.8235527500], [-45.9122197953, -22.8161066880], [-45.9038582636, -22.8187655216], [-45.9083441798, -22.8289442393], [-45.9052257060, -22.8336041132], [-45.8935553653, -22.8387144259]]] } }

    return {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "coordinates": [
              [
                [
                  -45.89973434973365,
                  -23.23444941961735
                ],
                [
                  -45.899779635144625,
                  -23.234453303468158
                ],
                [
                  -45.89973736876104,
                  -23.234683005301108
                ],
                [
                  -45.89968785671172,
                  -23.23467523761272
                ],
                [
                  -45.89973434973365,
                  -23.23444941961735
                ]
              ]
            ],
            "type": "Polygon"
          }
        }
      ]
    }
  }

}
