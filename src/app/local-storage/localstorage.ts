export class Localstorage {

    public setPath(path: any) {
        localStorage.setItem('path', path);
    }

    public getPath() {
        const storedPath = localStorage.getItem('path');
        if (storedPath) {
            const coordinates = storedPath.split(',').map(Number);
            const formattedCoordinates = [];
    
            // Agrupar as coordenadas em conjuntos de três e adicionar ao array formatado
            for (let i = 0; i < coordinates.length; i += 3) {
                formattedCoordinates.push([
                    coordinates[i],
                    coordinates[i + 1],
                    coordinates[i + 2]
                ]);
            }
    
            return formattedCoordinates;
        } else {
            console.error('Nenhuma coordenada armazenada no localStorage.');
            return []; 
        }
    }

}
