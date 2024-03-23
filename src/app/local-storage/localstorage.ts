export class Localstorage {

    public setPath(path: any) {
        const jsonString = JSON.stringify(path);
        localStorage.setItem('path', jsonString);
    }

    public getPath() {
        const jsonString = localStorage.getItem('path');

        if (jsonString) {
            const dataArray = JSON.parse(jsonString);
            return dataArray
        } else {
            return [];
        }
    }

}
