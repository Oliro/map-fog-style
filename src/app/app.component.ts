import { Component, OnInit } from '@angular/core';

import * as L from 'leaflet';
import 'leaflet.heat';

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

  public timeoutId: any;

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
    this.polylineBorder = L.polyline([], { color: '#025159', weight: 5 }).addTo(this.map);
    this.heatMap = L.heatLayer([], { radius: 8 });

    tiles.addTo(this.map);
    this.polyline.addTo(this.map);
    this.polylineBorder.addTo(this.map);
    this.heatMap.addTo(this.map)

    setTimeout(() => {
      this.zoneToExplore();
    }, 3000);

  }

  startTracking() {
    if (navigator.geolocation) {
      const options = { enableHighAccuracy: true, timeout: 100, maximumAge: 0 };
      this.watchId = navigator.geolocation.watchPosition((position) => {

        this.updateCoordinates(position);

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
        }

        this.timeoutId = setTimeout(() => {
          console.log('teste')
          this.map.flyTo([latitude, longitude], 18, {
            duration: 2,
            easeLinearity: 0.25,
            animate: true
          });
        }, 1000);

      }, (error) => error, options);
    } else {
      alert("Navegador não suportado")
    }
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
    this.createIcons(latitude, longitude)
  }

  createIcons(latitude: number, longitude: number) {
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

    circle.bindPopup("Zona de trabalho = " + sizeZone*2 + ' metros de diâmetro');

  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }
}
