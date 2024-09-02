document.getElementById('imageUpload').addEventListener('change', loadImage);
document.getElementById('resizeButton').addEventListener('click', resizeImage);
document.getElementById('enhanceButton').addEventListener('click', toggleDropdown);
document.getElementById('equalizeButton').addEventListener('click', equalizeImage);
document.getElementById('sharpenButton').addEventListener('click', sharpenImage);
document.getElementById('histobrightenButton').addEventListener('click', histobrighten);
document.getElementById('generateHistogram').addEventListener('click', generateHistogram);
document.getElementById('gentlySharpenButton').addEventListener('click', gentlySharpen);
document.getElementById('gammaBrightenButton').addEventListener('click', gammaBrighten);

let canvas = document.getElementById('imageCanvas');
let ctx = canvas.getContext('2d');

let processedCanvas = document.getElementById('processedCanvas');
let processedCtx = processedCanvas.getContext('2d');

let originalImageData = null;  // To store the original image data
let currentImageData = null;   // To store the current image data (for histogram)

const maxWidth = 600; // Maximum width for the image on the canvas
const maxHeight = 400; // Maximum height for the image on the canvas

function loadImage(event) {
    if (event.target.files && event.target.files[0]) {
        let image = new Image();
        image.onload = function() {
            let width = image.width;
            let height = image.height;

            // Maintain aspect ratio
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
        }

        image.onerror = function() {
            alert("Error loading image. Please try again.");
        }

        image.src = URL.createObjectURL(event.target.files[0]);
    } else {
        alert("No file selected. Please choose an image.");
    }
}

function resizeImage() {
    let width = document.getElementById('widthInput').value;
    let height = document.getElementById('heightInput').value;

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
        alert("Please enter both width and height.");
    }
}

function generateHistogram() {
    let imageData = currentImageData || originalImageData;
    if (imageData) {
        let data = imageData.data;
        let histogram = new Array(256).fill(0);

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
    
    const canvasWidth = 600;
    const canvasHeight = 300;
    const margin = 50; // Space for labels and axes

    histogramCanvas.width = canvasWidth;
    histogramCanvas.height = canvasHeight;

    histogramCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    let max = Math.max(...histogram);

    // Draw Y axis
    histogramCtx.beginPath();
    histogramCtx.moveTo(margin, 0);
    histogramCtx.lineTo(margin, canvasHeight - margin);
    histogramCtx.strokeStyle = 'black';
    histogramCtx.stroke();

    // Draw X axis
    histogramCtx.beginPath();
    histogramCtx.moveTo(margin, canvasHeight - margin);
    histogramCtx.lineTo(canvasWidth, canvasHeight - margin);
    histogramCtx.strokeStyle = 'black';
    histogramCtx.stroke();

    // Draw Y axis labels
    histogramCtx.font = "12px Poppins";
    histogramCtx.fillStyle = "black";
    histogramCtx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
        let label = Math.round((max / 5) * i);
        let yPos = canvasHeight - margin - (canvasHeight - margin) * i / 5;
        histogramCtx.fillText(label, margin - 10, yPos + 5);
    }

    // Draw X axis labels (0 to 255)
    histogramCtx.textAlign = "center";
    for (let i = 0; i <= 255; i += 51) {
        let xPos = margin + i * (canvasWidth - margin) / 256;
        histogramCtx.fillText(i, xPos, canvasHeight - margin + 20);
    }

    // Draw the histogram bars
    histogramCtx.fillStyle = 'darkblue';
    for (let i = 0; i < histogram.length; i++) {
        let value = histogram[i] / max * (canvasHeight - margin);
        let xPos = margin + i * (canvasWidth - margin) / 256;
        histogramCtx.fillRect(xPos, canvasHeight - margin - value, (canvasWidth - margin) / 256, value);
    }

    // Label the axes
    histogramCtx.font = "14px Poppins";
    histogramCtx.fillStyle = "black";
    histogramCtx.textAlign = "center";
    histogramCtx.fillText("Brightness Level", canvasWidth / 2, canvasHeight - 5);
    
    histogramCtx.save();
    histogramCtx.translate(15, canvasHeight / 2);
    histogramCtx.rotate(-Math.PI / 2);
    histogramCtx.textAlign = "center";
    histogramCtx.fillText("Frequency", 0, 0);
    histogramCtx.restore();
}

function enhanceImage() {
    if (currentImageData) {
        let data = currentImageData.data;

        let contrastFactor = (259 * (128 + 100)) / (255 * (259 - 100));

        for (let i = 0; i < data.length; i += 4) {
            data[i] = truncate(contrastFactor * (data[i] - 128) + 128);
            data[i + 1] = truncate(contrastFactor * (data[i + 1] - 128) + 128);
            data[i + 2] = truncate(contrastFactor * (data[i + 2] - 128) + 128);
        }

        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to enhance.");
    }
}

function equalizeImage() {
    if (currentImageData) {
        let data = currentImageData.data;

        let histogram = new Array(256).fill(0);
        for (let i = 0; i < data.length; i += 4) {
            let brightness = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            histogram[brightness]++;
        }

        let cdf = histogram.slice();
        for (let i = 1; i < cdf.length; i++) {
            cdf[i] += cdf[i - 1];
        }

        let minValue = cdf.find(value => value > 0);
        let numPixels = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
            let brightness = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            let equalizedValue = Math.round(((cdf[brightness] - minValue) / (numPixels - minValue)) * 255);
            data[i] = data[i + 1] = data[i + 2] = equalizedValue;
        }

        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to equalize.");
    }
}

function truncate(value) {
    return Math.min(255, Math.max(0, value));
}

function sharpenImage() {
    if (currentImageData) {
        let kernel = [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
        ];

        let width = currentImageData.width;
        let height = currentImageData.height;
        let data = currentImageData.data;
        let newImageData = new Uint8ClampedArray(data.length);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let r = 0, g = 0, b = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        let pixel = ((y + ky) * width + (x + kx)) * 4;
                        let weight = kernel[ky + 1][kx + 1];

                        r += data[pixel] * weight;
                        g += data[pixel + 1] * weight;
                        b += data[pixel + 2] * weight;
                    }
                }

                let pixel = (y * width + x) * 4;
                newImageData[pixel] = truncate(r);
                newImageData[pixel + 1] = truncate(g);
                newImageData[pixel + 2] = truncate(b);
                newImageData[pixel + 3] = data[pixel + 3]; // alpha channel
            }
        }

        currentImageData.data.set(newImageData);
        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to sharpen.");
    }
}
 
function histobrighten() {
    if (currentImageData) {
        let data = currentImageData.data;
        let histogram = new Array(256).fill(0);

        // Calculate histogram
        for (let i = 0; i < data.length; i += 4) {
            let brightness = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            histogram[brightness]++;
        }

        // Compute cumulative histogram
        let cdf = histogram.slice();
        for (let i = 1; i < cdf.length; i++) {
            cdf[i] += cdf[i - 1];
        }

        // Determine the max and min values for stretching
        let minValue = cdf.find(value => value > 0);
        let maxValue = cdf[cdf.length - 1];
        let numPixels = data.length / 4;
        let stretchFactor = 255 / (maxValue - minValue);

        // Apply brightness adjustment based on histogram
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Compute new values with stretching
            data[i] = truncate((cdf[Math.round(0.299 * r + 0.587 * g + 0.114 * b)] - minValue) * stretchFactor);
            data[i + 1] = truncate((cdf[Math.round(0.299 * r + 0.587 * g + 0.114 * b)] - minValue) * stretchFactor);
            data[i + 2] = truncate((cdf[Math.round(0.299 * r + 0.587 * g + 0.114 * b)] - minValue) * stretchFactor);
        }

        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to apply histogram-based brightness adjustment.");
    }
}

function toggleDropdown() {
    let dropdown = document.getElementById('enhanceDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Gently sharpen the image
function gentlySharpen() {
    if (currentImageData) {
        let kernel = [
            [0, -0.1, 0],
            [-0.1, 1.4, -0.1],
            [0, -0.1, 0]
        ];

        let width = currentImageData.width;
        let height = currentImageData.height;
        let data = currentImageData.data;
        let newImageData = new Uint8ClampedArray(data.length);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let r = 0, g = 0, b = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        let pixel = ((y + ky) * width + (x + kx)) * 4;
                        let weight = kernel[ky + 1][kx + 1];

                        r += data[pixel] * weight;
                        g += data[pixel + 1] * weight;
                        b += data[pixel + 2] * weight;
                    }
                }

                let pixel = (y * width + x) * 4;
                newImageData[pixel] = truncate(r);
                newImageData[pixel + 1] = truncate(g);
                newImageData[pixel + 2] = truncate(b);
                newImageData[pixel + 3] = data[pixel + 3]; // alpha channel
            }
        }

        currentImageData.data.set(newImageData);
        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to gently sharpen.");
    }
}

// Gamma correction for brightness
function gammaBrighten() {
    if (currentImageData) {
        let gamma = 1.5; // Adjust gamma value as needed
        let data = currentImageData.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = truncate(255 * Math.pow(data[i] / 255, gamma));
            data[i + 1] = truncate(255 * Math.pow(data[i + 1] / 255, gamma));
            data[i + 2] = truncate(255 * Math.pow(data[i + 2] / 255, gamma));
        }

        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to apply gamma correction.");
    }
}

function truncate(value) {
    return Math.min(255, Math.max(0, value));
}
