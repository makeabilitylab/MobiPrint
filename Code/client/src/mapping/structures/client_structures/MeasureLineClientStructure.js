import ClientStructure from "./ClientStructure";

class MeasureLineClientStructure extends ClientStructure {
    constructor(x0, y0, x1, y1) {
        super(x0, y0);
        this.startX = x0;
        this.startY = y0;
        this.endX = x1;
        this.endY = y1;
        this.active = false;
        this.activePoint = null; // Variable to track which point is active (start or end)
        this.circleHitboxPadding = 15; // Padding for the hitboxes around the circles
    }

    draw(ctxWrapper, transformationMatrixToScreenSpace, scaleFactor, pixelSize) {
        const ctx = ctxWrapper.getContext();
        const pStart = new DOMPoint(this.startX, this.startY).matrixTransform(transformationMatrixToScreenSpace);
        const pEnd = new DOMPoint(this.endX, this.endY).matrixTransform(transformationMatrixToScreenSpace);

        // Draw the line between the start and end points
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.stroke();

        // Draw circles at the start and end points
        ctx.fillStyle = this.activePoint === "start" ? "red" : "black";
        ctx.beginPath();
        ctx.arc(pStart.x, pStart.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.activePoint === "end" ? "red" : "black";
        ctx.beginPath();
        ctx.arc(pEnd.x, pEnd.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Calculate the distance between the start and end points

        const distance = Math.hypot(this.endX - this.startX, this.endY - this.startY) * pixelSize ;
        const label = `Distance: ${distance.toFixed(2)} cm`;

        // Display the distance as a text label
        ctx.fillStyle = "black";
        ctx.font = `${Math.round(4 * scaleFactor)}px Arial`;
        ctx.fillText(label, (pStart.x + pEnd.x) / 2, (pStart.y + pEnd.y) / 2 - 10);
    }

    tap(tappedPoint, transformationMatrixToScreenSpace) {
        const pStart = new DOMPoint(this.startX, this.startY).matrixTransform(transformationMatrixToScreenSpace);
        const pEnd = new DOMPoint(this.endX, this.endY).matrixTransform(transformationMatrixToScreenSpace);

        // Check if the tap is near either end point of the line
        if (this.distanceToPoint(tappedPoint, pStart) <= this.circleHitboxPadding) {
            this.active = true;
            this.activePoint = "start";
            return {
                stopPropagation: true
            };
        } else if (this.distanceToPoint(tappedPoint, pEnd) <= this.circleHitboxPadding) {
            this.active = true;
            this.activePoint = "end";
            return {
                stopPropagation: true
            };
        } else {
            this.active = false;
            this.activePoint = null;
            return {
                stopPropagation: false
            };
        }
    }

    translate(startCoordinates, lastCoordinates, currentCoordinates, transformationMatrixToScreenSpace) {
        if (this.active) {
            const { dx, dy } = ClientStructure.calculateTranslateDelta(lastCoordinates, currentCoordinates, transformationMatrixToScreenSpace);
            if (this.activePoint === "start") {
                this.startX += dx;
                this.startY += dy;
            } else if (this.activePoint === "end") {
                this.endX += dx;
                this.endY += dy;
            }
            return {
                stopPropagation: true
            };
        }
        return {
            stopPropagation: false
        };
    }

    getType() {
        return MeasureLineClientStructure.TYPE;
    }

    distanceToPoint(point, endPoint) {
        return Math.hypot(point.x - endPoint.x, point.y - endPoint.y);
    }
}

MeasureLineClientStructure.TYPE = "MeasureLineClientStructure";
export default MeasureLineClientStructure;
