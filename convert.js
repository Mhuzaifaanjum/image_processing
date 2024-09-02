document.getElementById('imageUpload').addEventListener('change', loadImage);
document.getElementById('resizeButton').addEventListener('click', resizeImage);
document.getElementById('generateHistogram').addEventListener('click', generateHistogram);
document.getElementById('colorToGreyButton').addEventListener('click', colorToGrey);
document.getElementById('rgbToPaletteButton').addEventListener('click', rgbToPalette);
document.getElementById('paletteToRgbButton').addEventListener('click', paletteToRgb);
document.getElementById('reducePaletteButton').addEventListener('click', reducePaletteColors);
document.getElementById('to8BitButton').addEventListener('click', to8BitImage);
document.getElementById('to1BitButton').addEventListener('click', to1BitImage);

let canvas = document.getElementById('imageCanvas');
let ctx = canvas.getContext('2d');
let processedCanvas = document.getElementById('processedCanvas');
let processedCtx = processedCanvas.getContext('2d');

let originalImageData = null;
let currentImageData = null;

const maxWidth = 600;
const maxHeight = 400;

function loadImage(event) {
    if (event.target.files && event.target.files[0]) {
        let image = new Image();
        image.onload = function() {
            let width = image.width;
            let height = image.height;

            if (width > maxWidth || height > maxHeight) {
                if (width > height) {
                    height *= maxWidth / width;
                    width = maxWidth;
                } else {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            processedCanvas.width = width;
            processedCanvas.height = height;

            ctx.drawImage(image, 0, 0, width, height);
            originalImageData = ctx.getImageData(0, 0, width, height);
            currentImageData = new ImageData(new Uint8ClampedArray(originalImageData.data), width, height);
            processedCtx.putImageData(currentImageData, 0, 0);
        };

        image.onerror = function() {
            alert("Error loading image. Please try again.");
        };

        image.src = URL.createObjectURL(event.target.files[0]);
    } else {
        alert("No file selected. Please choose an image.");
    }
}

function resizeImage() {
    let width = parseInt(document.getElementById('widthInput').value);
    let height = parseInt(document.getElementById('heightInput').value);

    if (width && height) {
        let tmpCanvas = document.createElement('canvas');
        let tmpCtx = tmpCanvas.getContext('2d');

        tmpCanvas.width = canvas.width;
        tmpCanvas.height = canvas.height;
        tmpCtx.drawImage(canvas, 0, 0);

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(tmpCanvas, 0, 0, width, height);
        currentImageData = ctx.getImageData(0, 0, width, height);

        processedCanvas.width = width;
        processedCanvas.height = height;
        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("Please enter valid width and height.");
    }
}

function generateHistogram() {
    let imageData = currentImageData || originalImageData;
    if (imageData) {
        let data = imageData.data;
        let histogram = new Array(256).fill(0);

        // Calculate histogram
        for (let i = 0; i < data.length; i += 4) {
            let brightness = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            histogram[brightness]++;
        }

        drawHistogram(histogram);
    } else {
        alert("No image data available to generate histogram.");
    }
}

function drawHistogram(histogram) {
    let histogramCanvas = document.getElementById('histogramCanvas');
    let histogramCtx = histogramCanvas.getContext('2d');

    histogramCanvas.width = 512; // Increased width
    histogramCanvas.height = 256; // Increased height

    histogramCtx.clearRect(0, 0, histogramCanvas.width, histogramCanvas.height);

    let max = Math.max(...histogram);
    let barWidth = (histogramCanvas.width - 40) / histogram.length;

    // Draw y-axis
    histogramCtx.beginPath();
    histogramCtx.moveTo(40, 0);
    histogramCtx.lineTo(40, histogramCanvas.height - 30);
    histogramCtx.strokeStyle = 'black';
    histogramCtx.stroke();

    // Draw x-axis
    histogramCtx.beginPath();
    histogramCtx.moveTo(40, histogramCanvas.height - 30);
    histogramCtx.lineTo(histogramCanvas.width, histogramCanvas.height - 30);
    histogramCtx.stroke();

    // Draw x-axis labels
    histogramCtx.font = '12px Arial';
    histogramCtx.fillStyle = 'black';
    histogramCtx.textAlign = 'center';
    for (let i = 0; i <= 255; i += 32) {
        let x = 40 + i * (histogramCanvas.width - 40) / 256;
        histogramCtx.fillText(i, x, histogramCanvas.height - 10);
    }

    // Draw y-axis labels
    histogramCtx.textAlign = 'right';
    for (let i = 0; i <= max; i += max / 5) {
        let y = histogramCanvas.height - 30 - i * (histogramCanvas.height - 30) / max;
        histogramCtx.fillText(Math.round(i), 30, y + 5);
    }

    // Draw histogram bars
    for (let i = 0; i < histogram.length; i++) {
        let value = histogram[i] / max * (histogramCanvas.height - 30);
        histogramCtx.fillStyle = 'black';
        histogramCtx.fillRect(40 + i * barWidth, histogramCanvas.height - 30 - value, barWidth, value);
    }
}

function colorToGrey() {
    if (currentImageData) {
        let data = currentImageData.data;

        for (let i = 0; i < data.length; i += 4) {
            let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
        }

        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to convert to grayscale.");
    }
}

function rgbToPalette() {
    if (currentImageData) {
        let data = currentImageData.data;
        let palette = [...Array(256).keys()].map(i => `rgb(${i}, ${i}, ${i})`);

        for (let i = 0; i < data.length; i += 4) {
            let avg = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
            let nearestColor = palette[Math.round(avg)];
            let [r, g, b] = nearestColor.match(/\d+/g).map(Number);
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }

        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to convert to palette.");
    }
}

function paletteToRgb() {
    if (currentImageData) {
        let data = currentImageData.data;
        let palette = [...Array(256).keys()].map(i => `rgb(${i}, ${i}, ${i})`);

        for (let i = 0; i < data.length; i += 4) {
            let nearestColor = palette[Math.round((data[i] + data[i + 1] + data[i + 2]) / 3)];
            let [r, g, b] = nearestColor.match(/\d+/g).map(Number);
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }

        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to convert from palette.");
    }
}

function reducePaletteColors() {
    if (currentImageData) {
        let data = currentImageData.data;
        let numColors = 16;
        let colors = [...Array(numColors).keys()].map(i => `rgb(${i * (255 / numColors)}, 0, 0)`);

        for (let i = 0; i < data.length; i += 4) {
            let nearestColor = colors[Math.round(Math.random() * (numColors - 1))];
            let [r, g, b] = nearestColor.match(/\d+/g).map(Number);
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }

        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to reduce palette colors.");
    }
}

function to8BitImage() {
    if (currentImageData) {
        let data = currentImageData.data;
        let newImageData = new Uint8ClampedArray(currentImageData.data.length);
        let numColors = 256; // 8-bit image can have 256 colors

        for (let i = 0; i < data.length; i += 4) {
            let avg = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
            newImageData[i] = avg;       // Red
            newImageData[i + 1] = avg;   // Green
            newImageData[i + 2] = avg;   // Blue
            newImageData[i + 3] = data[i + 3]; // Alpha
        }

        processedCtx.putImageData(new ImageData(newImageData, currentImageData.width, currentImageData.height), 0, 0);
    } else {
        alert("No image data available to convert to 8-bit.");
    }
}

function to1BitImage() {
    if (currentImageData) {
        let data = currentImageData.data;
        let newImageData = new Uint8ClampedArray(currentImageData.data.length);

        for (let i = 0; i < data.length; i += 4) {
            let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            let threshold = 128; // Simple threshold for binary image
            let value = avg < threshold ? 0 : 255;
            newImageData[i] = value;       // Red
            newImageData[i + 1] = value;   // Green
            newImageData[i + 2] = value;   // Blue
            newImageData[i + 3] = data[i + 3]; // Alpha
        }

        processedCtx.putImageData(new ImageData(newImageData, currentImageData.width, currentImageData.height), 0, 0);
    } else {
        alert("No image data available to convert to 1-bit.");
    }
}
