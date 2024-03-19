import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

@Component({
  selector: 'app-tf-ml',
  templateUrl: './tf-ml.component.html',
  styleUrls: ['./tf-ml.component.scss']
})
export class TfMlComponent implements OnInit {

  @ViewChild('video', { static: false }) videoElement!: ElementRef;
  @ViewChild('canvas', { static: false }) canvas!: ElementRef;

  async ngOnInit() {

    await tf.setBackend('webgl');

    const model = await cocoSsd.load();
    console.log("COCO-SSD model loaded:", model);

    const video = this.videoElement.nativeElement;
    const canvas = this.canvas.nativeElement;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        this.detectObjects(video, model, canvas);
      };
    } catch (error) {
      // Lidar com erros de permissão
      console.error('Erro ao acessar a câmera:', error);
    }

  }

  async detectObjects(video: any, model: any, canvas: any) {
    
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    const predictions = await model.detect(video);

    if (predictions.length > 0) {
      predictions.forEach((prediction: any) => {
        // Estilizando a caixa delimitadora
        const lineWidth = 1;
        const borderColor = 'white'; // Cor do contorno vermelho
        const backgroundColor = 'rgba(0, 255, 0, 0.25)'; // Cor de fundo verde com 50% de opacidade
    
        // Desenhar caixa delimitadora
        context.beginPath();
        context.lineWidth = lineWidth;
        context.strokeStyle = borderColor;
        context.fillStyle = backgroundColor;
        context.rect(prediction.bbox[0], prediction.bbox[1], prediction.bbox[2], prediction.bbox[3]);
        context.stroke();
        context.fill();
    
        // Estilizando o texto da classe do objeto (cabeçalho)
        const headerBackgroundColor = 'black'; // Fundo preto
        const headerTextColor = 'white'; // Texto branco

        const headerText = `${prediction.class} - ${Math.round(prediction.score * 100)}%`;
        const headerWidth = prediction.bbox[2];

        // Desenhar o texto da classe do objeto
        context.font = '16px Arial';
        context.fillStyle = headerBackgroundColor;
        context.fillRect(prediction.bbox[0], prediction.bbox[1] - 20, headerWidth, 20); // Retângulo para o cabeçalho
        context.fillStyle = headerTextColor;
        context.fillText(headerText, prediction.bbox[0], prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10);
      });
    
    } else {
      // Adicione um código aqui para lidar com a ausência de detecção de objetos
      console.log("Nenhum objeto detectado.");
    }

    requestAnimationFrame(() => this.detectObjects(video, model, canvas));
  }
  
}
