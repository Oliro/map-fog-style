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

  public displacementLimit = 20; // Limite de deslocamento máximo em metros
  public speedLimit = 5; // Limite de velocidade máxima em metros por segundo
  public accelerationLimit = 20; // Limite de aceleração máxima em metros por segundo ao quadrado
  public timeInterval = 500; // Intervalo de tempo entre leituras de GPS em milissegundos

  public lastPosition: any = null;
  public lastSpeed: number = 0;
  public lastTimestamp: number = 0;
  public speed!: number; 

  public pontos: number = 0;
  public mensagem = '1-Inicio';

  ngOnInit(): void {
    this.createMap();
  }

  createMap() {

    this.map = L.map('map').setView([-23.234419534508827, -45.899720000703645], 19);

    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxNativeZoom:19,
      maxZoom:25,
      minZoom: 10,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    this.polyline = L.polyline([], { color: '#400036', weight: 8, opacity: 0.5 }).addTo(this.map);
    this.polylineBorder = L.polyline([], { color: '#FF81D0', weight: 5 }).addTo(this.map);
    this.heatMap = L.heatLayer([], { radius: 8 });

    tiles.addTo(this.map);
    this.polyline.addTo(this.map);
    this.polylineBorder.addTo(this.map);
    this.heatMap.addTo(this.map)

  }

  startTracking() {
    if (navigator.geolocation) {
      const options = { enableHighAccuracy: true, timeout: 100, maximumAge: 0 };
      this.watchId = navigator.geolocation.watchPosition(this.updateCoordinates.bind(this), (error) => error, options);
    } else {
      alert("Navegador não suportado")
    }
  }

  stopTracking() {
    navigator.geolocation.clearWatch(this.watchId)
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
      const distancia = this.calcularDistancia(latitude, longitude, this.lastPosition.coords.latitude, this.lastPosition.coords.longitude);
      // Calcular o intervalo de tempo entre as leituras de GPS
      const diferenca_tempo = currentTime - this.lastTimestamp;
      // Calcular a velocidade em metros por segundo
      const velocidade = distancia / diferenca_tempo * 1000;

      if (distancia <= this.displacementLimit && velocidade <= this.speedLimit && diferenca_tempo >= this.timeInterval) {
        this.addPathLine(latitude, longitude)
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
  }

  calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }
}
