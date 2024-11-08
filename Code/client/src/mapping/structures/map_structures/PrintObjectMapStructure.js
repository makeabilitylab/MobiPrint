import MapStructure from "./MapStructure";
import testPrintIconSVG from "../icons/printicon-1.svg";


const img = new Image();
img.src = testPrintIconSVG;

class PrintObjectMapStructure extends MapStructure {
    constructor(x0, y0) {
        super(x0, y0);
    }
    draw(ctxWrapper, transformationMatrixToScreenSpace, scaleFactor) {
        const ctx = ctxWrapper.getContext();
        const p0 = new DOMPoint(this.x0, this.y0).matrixTransform(transformationMatrixToScreenSpace);
        const scaledSize = {
            width: Math.max(img.width / (7 / scaleFactor), img.width),
            height: Math.max(img.height / (7 / scaleFactor), img.height)
        };
        ctx.drawImage(img, p0.x - scaledSize.width / 2, p0.y - scaledSize.height, scaledSize.width, scaledSize.height);
    }
    getType() {
        return PrintObjectMapStructure.TYPE;
    }
}
PrintObjectMapStructure.TYPE = "PrintObjectMapStructure";
export default PrintObjectMapStructure;
