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

  // Constantes para os limites de filtro (ajuste conforme necessário)
  public LIMITE_DESLOCAMENTO = 20; // Limite de deslocamento máximo em metros
  public LIMITE_VELOCIDADE = 5; // Limite de velocidade máxima em metros por segundo
  public LIMITE_ACELERACAO = 20; // Limite de aceleração máxima em metros por segundo ao quadrado
  public INTERVALO_TEMPO = 500; // Intervalo de tempo entre leituras de GPS em milissegundos

  // Variáveis para armazenar a última posição, a última velocidade e o último timestamp
  public lastPosition: any = null;
  public lastVelocidade: number = 0;
  public lastTimestamp: number = 0;
  public velocidade!: number; // Declaração da variável velocidade fora do bloco if/else

  public pontos: number = 0;
  public mensagem = '2-Inicio';

  ngOnInit(): void {

    this.createMap();

  }

  createMap() {

    this.map = L.map('map').setView([-23.234419534508827, -45.899720000703645], 18);

    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 10,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });


    this.heatMap = L.heatLayer([], { radius: 8 });

    tiles.addTo(this.map)
    this.heatMap.addTo(this.map)

  }

  startTracking() {
    if (navigator.geolocation) {

      const options = {
        enableHighAccuracy: true,
        timeout: 100,
        maximumAge: 0,
      };

      this.watchId = navigator.geolocation.watchPosition(this.updateCoordinates.bind(this), (error) => error, options);

      
    } else {
      alert("Navegador não suportado")
    }
  }

  stopTracking() {
    navigator.geolocation.clearWatch(this.watchId)
  }

  updateCoordinates(position: any) {
    //debugger

    const pathStyle = {
      color: 'red',
      weight: 2,
      smoothFactor: 0.5
    };

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const timestamp_atual = position.timestamp;

    // Verificar se há uma posição anterior para calcular o deslocamento
    if (this.lastPosition && this.lastTimestamp) {

      this.pontos++
      this.mensagem = 'criando novos pontos - ' + this.pontos + 'accuracy= '+position.coords.accuracy+' metros';

      // Calcular o deslocamento entre a posição atual e a posição anterior
      const distancia = this.calcularDistancia(latitude, longitude, this.lastPosition.coords.latitude, this.lastPosition.coords.longitude);

      // Calcular o intervalo de tempo entre as leituras de GPS
      const diferenca_tempo = timestamp_atual - this.lastTimestamp;

      // Calcular a velocidade em metros por segundo
      const velocidade = distancia / diferenca_tempo * 1000; 



      // Aplicar os filtros
      if (distancia <= this.LIMITE_DESLOCAMENTO && velocidade <= this.LIMITE_VELOCIDADE && diferenca_tempo >= this.INTERVALO_TEMPO) {
        // Adicionar as novas coordenadas
        this.coordinatesArray.push([latitude, longitude, 1]);


        // Atualizar o polyline com as novas coordenadas
        if (this.polyline) {
          this.polyline.addLatLng([latitude, longitude]);
          this.heatMap.addLatLng([latitude, longitude, 1]);
        } else {
          this.polyline = L.polyline(this.coordinatesArray, pathStyle).addTo(this.map);
        }
      } else {
        console.log('Ponto descartado devido a filtros.');
        this.mensagem = 'Ponto descartado devido a filtros.'
      }
    } else {
      this.mensagem = "Cria primeiro ponto"
      // Se não houver posição anterior, adicione a nova posição
      this.coordinatesArray.push([latitude, longitude, 1]);
      this.heatMap.addLatLng([latitude, longitude, 1]);

      // Criar polyline se não existir ainda
      if (!this.polyline) {
        this.polyline = L.polyline(this.coordinatesArray, pathStyle).addTo(this.map);
      }
    }

    // Atualizar a última posição, a última velocidade e o último timestamp
    this.lastPosition = position;
    this.lastVelocidade = this.velocidade;
    this.lastTimestamp = timestamp_atual;

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
    if (this.map) {
      this.map.remove();
    }

  }
}
