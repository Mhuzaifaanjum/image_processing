// Add event listeners
document.getElementById('imageUpload').addEventListener('change', loadImage);
document.getElementById('resizeButton').addEventListener('click', resizeImage);
document.getElementById('generateHistogram').addEventListener('click', generateHistogram);
document.getElementById('lowPassButton').addEventListener('click', toggleLowPassDropdown);
document.getElementById('highPassButton').addEventListener('click', toggleHighPassDropdown);
document.getElementById('averagingButton').addEventListener('click', applyAveragingFilter);
document.getElementById('binomialButton').addEventListener('click', applyBinomialFilter);
document.getElementById('medianButton').addEventListener('click', applyMedianFilter);
document.getElementById('centeredWeightMedianButton').addEventListener('click', applyCenteredWeightMedianFilter);
document.getElementById('laplacianButton').addEventListener('click', applyLaplacianFilter);
document.getElementById('robertsButton').addEventListener('click', applyRobertsFilter);
document.getElementById('gradientButton').addEventListener('click', applyGradientFilter);

// Initialize canvas contexts
let canvas = document.getElementById('imageCanvas');
let ctx = canvas.getContext('2d');
let processedCanvas = document.getElementById('processedCanvas');
let processedCtx = processedCanvas.getContext('2d');
let histogramCanvas = document.getElementById('histogramCanvas');
let histogramCtx = histogramCanvas.getContext('2d');

// Initialize variables to store image data
let originalImageData = null;  // To store the original image data
let currentImageData = null;   // To store the current image data (for histogram)

// Maximum dimensions for the image
const maxWidth = 600; // Maximum width for the image on the canvas
const maxHeight = 400; // Maximum height for the image on the canvas

// Function to load an image
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
        };

        image.onerror = function() {
            alert("Error loading image. Please try again.");
        };

        image.src = URL.createObjectURL(event.target.files[0]);
    } else {
        alert("No file selected. Please choose an image.");
    }
}

// Function to resize the image
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

// Function to generate histogram
function generateHistogram() {
    if (!currentImageData) {
        alert("No image data available.");
        return;
    }

    let imageData = currentImageData;
    let histogramData = new Array(256).fill(0);
    let totalPixels = imageData.width * imageData.height;
    let data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let red = data[i];
        let green = data[i + 1];
        let blue = data[i + 2];
        let gray = Math.floor((red + green + blue) / 3);
        histogramData[gray]++;
    }

    // Draw histogram
    histogramCanvas.width = 600;
    histogramCanvas.height = 200;
    histogramCtx.clearRect(0, 0, histogramCanvas.width, histogramCanvas.height);

    // Draw X and Y axis
    histogramCtx.strokeStyle = 'black';
    histogramCtx.beginPath();
    histogramCtx.moveTo(40, 10);
    histogramCtx.lineTo(40, histogramCanvas.height - 30);
    histogramCtx.lineTo(histogramCanvas.width - 10, histogramCanvas.height - 30);
    histogramCtx.stroke();

    // Draw X axis label
    histogramCtx.font = '12px Arial';
    histogramCtx.textAlign = 'center';
    histogramCtx.fillText('Gray Levels', histogramCanvas.width / 2, histogramCanvas.height - 10);

    // Draw Y axis label
    histogramCtx.save();
    histogramCtx.translate(10, histogramCanvas.height / 2);
    histogramCtx.rotate(-Math.PI / 2);
    histogramCtx.textAlign = 'center';
    histogramCtx.fillText('Frequency', 0, 0);
    histogramCtx.restore();

    // Draw histogram bars
    let maxCount = Math.max(...histogramData);
    let barWidth = (histogramCanvas.width - 50) / histogramData.length;

    for (let i = 0; i < histogramData.length; i++) {
        let height = (histogramData[i] / maxCount) * (histogramCanvas.height - 40);
        histogramCtx.fillStyle = 'black';
        histogramCtx.fillRect(40 + i * barWidth, histogramCanvas.height - 30 - height, barWidth, height);
    }
}

// Function to toggle the low pass filter dropdown
function toggleLowPassDropdown() {
    let dropdown = document.getElementById('lowPassDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Function to toggle the high pass filter dropdown
function toggleHighPassDropdown() {
    let dropdown = document.getElementById('highPassDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Implement averaging filter logic here
function applyAveragingFilter() {
    if (currentImageData) {
        let width = currentImageData.width;
        let height = currentImageData.height;
        let data = currentImageData.data;
        let newImageData = new Uint8ClampedArray(data.length);

        let kernelSize = 3; // Size of the averaging kernel
        let kernelHalf = Math.floor(kernelSize / 2);

        // Apply the averaging filter
        for (let y = kernelHalf; y < height - kernelHalf; y++) {
            for (let x = kernelHalf; x < width - kernelHalf; x++) {
                let r = 0, g = 0, b = 0;
                let count = 0;

                // Sum the pixel values in the kernel
                for (let ky = -kernelHalf; ky <= kernelHalf; ky++) {
                    for (let kx = -kernelHalf; kx <= kernelHalf; kx++) {
                        let pixel = ((y + ky) * width + (x + kx)) * 4;
                        r += data[pixel];
                        g += data[pixel + 1];
                        b += data[pixel + 2];
                        count++;
                    }
                }

                let pixel = (y * width + x) * 4;
                newImageData[pixel] = Math.round(r / count);
                newImageData[pixel + 1] = Math.round(g / count);
                newImageData[pixel + 2] = Math.round(b / count);
                newImageData[pixel + 3] = data[pixel + 3]; // alpha channel
            }
        }

        currentImageData.data.set(newImageData);
        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to apply averaging filter.");
    }
}

// Implement binomial filter logic here
function applyBinomialFilter() {
    if (currentImageData) {
        let width = currentImageData.width;
        let height = currentImageData.height;
        let data = currentImageData.data;
        let newImageData = new Uint8ClampedArray(data.length);

        let kernel = [
            [1, 2, 1],
            [2, 4, 2],
            [1, 2, 1]
        ];

        let kernelSize = kernel.length;
        let kernelHalf = Math.floor(kernelSize / 2);

        // Apply the binomial filter
        for (let y = kernelHalf; y < height - kernelHalf; y++) {
            for (let x = kernelHalf; x < width - kernelHalf; x++) {
                let r = 0, g = 0, b = 0;
                let sum = 0;

                // Sum the pixel values in the kernel
                for (let ky = -kernelHalf; ky <= kernelHalf; ky++) {
                    for (let kx = -kernelHalf; kx <= kernelHalf; kx++) {
                        let weight = kernel[ky + kernelHalf][kx + kernelHalf];
                        let pixel = ((y + ky) * width + (x + kx)) * 4;
                        r += data[pixel] * weight;
                        g += data[pixel + 1] * weight;
                        b += data[pixel + 2] * weight;
                        sum += weight;
                    }
                }

                let pixel = (y * width + x) * 4;
                newImageData[pixel] = Math.round(r / sum);
                newImageData[pixel + 1] = Math.round(g / sum);
                newImageData[pixel + 2] = Math.round(b / sum);
                newImageData[pixel + 3] = data[pixel + 3]; // alpha channel
            }
        }

        currentImageData.data.set(newImageData);
        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to apply binomial filter.");
    }
}

// Implement median filter logic here
function applyMedianFilter() {
    if (currentImageData) {
        let width = currentImageData.width;
        let height = currentImageData.height;
        let data = currentImageData.data;
        let newImageData = new Uint8ClampedArray(data.length);

        let kernelSize = 3;
        let kernelHalf = Math.floor(kernelSize / 2);

        // Apply the median filter
        for (let y = kernelHalf; y < height - kernelHalf; y++) {
            for (let x = kernelHalf; x < width - kernelHalf; x++) {
                let rValues = [];
                let gValues = [];
                let bValues = [];

                // Collect pixel values in the kernel
                for (let ky = -kernelHalf; ky <= kernelHalf; ky++) {
                    for (let kx = -kernelHalf; kx <= kernelHalf; kx++) {
                        let pixel = ((y + ky) * width + (x + kx)) * 4;
                        rValues.push(data[pixel]);
                        gValues.push(data[pixel + 1]);
                        bValues.push(data[pixel + 2]);
                    }
                }

                // Sort and find the median
                rValues.sort((a, b) => a - b);
                gValues.sort((a, b) => a - b);
                bValues.sort((a, b) => a - b);

                let medianIndex = Math.floor(rValues.length / 2);
                let pixel = (y * width + x) * 4;
                newImageData[pixel] = rValues[medianIndex];
                newImageData[pixel + 1] = gValues[medianIndex];
                newImageData[pixel + 2] = bValues[medianIndex];
                newImageData[pixel + 3] = data[pixel + 3]; // alpha channel
            }
        }

        currentImageData.data.set(newImageData);
        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to apply median filter.");
    }
}

// Implement centered weight median filter logic here
function applyCenteredWeightMedianFilter() {
    if (currentImageData) {
        let width = currentImageData.width;
        let height = currentImageData.height;
        let data = currentImageData.data;
        let newImageData = new Uint8ClampedArray(data.length);

        // Define the weights for the centered weighted median filter
        let kernel = [
            [0, 0, 1, 0, 0],
            [0, 1, 2, 1, 0],
            [1, 2, 4, 2, 1],
            [0, 1, 2, 1, 0],
            [0, 0, 1, 0, 0]
        ];

        let kernelSize = kernel.length;
        let kernelHalf = Math.floor(kernelSize / 2);

        // Apply the centered weight median filter
        for (let y = kernelHalf; y < height - kernelHalf; y++) {
            for (let x = kernelHalf; x < width - kernelHalf; x++) {
                let rValues = [];
                let gValues = [];
                let bValues = [];

                // Collect weighted pixel values in the kernel
                for (let ky = -kernelHalf; ky <= kernelHalf; ky++) {
                    for (let kx = -kernelHalf; kx <= kernelHalf; kx++) {
                        let weight = kernel[ky + kernelHalf][kx + kernelHalf];
                        let pixel = ((y + ky) * width + (x + kx)) * 4;
                        rValues.push(data[pixel] * weight);
                        gValues.push(data[pixel + 1] * weight);
                        bValues.push(data[pixel + 2] * weight);
                    }
                }

                // Sort and find the median
                rValues.sort((a, b) => a - b);
                gValues.sort((a, b) => a - b);
                bValues.sort((a, b) => a - b);

                let medianIndex = Math.floor(rValues.length / 2);
                let pixel = (y * width + x) * 4;
                newImageData[pixel] = Math.round(rValues[medianIndex]);
                newImageData[pixel + 1] = Math.round(gValues[medianIndex]);
                newImageData[pixel + 2] = Math.round(bValues[medianIndex]);
                newImageData[pixel + 3] = data[pixel + 3]; // alpha channel
            }
        }

        currentImageData.data.set(newImageData);
        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to apply centered weight median filter.");
    }
}

// Implement Laplacian filter logic here
function applyLaplacianFilter() {
    if (currentImageData) {
        let width = currentImageData.width;
        let height = currentImageData.height;
        let data = currentImageData.data;
        let newImageData = new Uint8ClampedArray(data.length);

        let kernel = [
            [0, -1, 0],
            [-1, 4, -1],
            [0, -1, 0]
        ];

        let kernelSize = kernel.length;
        let kernelHalf = Math.floor(kernelSize / 2);

        // Apply the Laplacian filter
        for (let y = kernelHalf; y < height - kernelHalf; y++) {
            for (let x = kernelHalf; x < width - kernelHalf; x++) {
                let r = 0, g = 0, b = 0;
                let sum = 0;

                // Sum the pixel values in the kernel
                for (let ky = -kernelHalf; ky <= kernelHalf; ky++) {
                    for (let kx = -kernelHalf; kx <= kernelHalf; kx++) {
                        let weight = kernel[ky + kernelHalf][kx + kernelHalf];
                        let pixel = ((y + ky) * width + (x + kx)) * 4;
                        r += data[pixel] * weight;
                        g += data[pixel + 1] * weight;
                        b += data[pixel + 2] * weight;
                        sum += weight;
                    }
                }

                let pixel = (y * width + x) * 4;
                newImageData[pixel] = Math.min(Math.max(r, 0), 255);
                newImageData[pixel + 1] = Math.min(Math.max(g, 0), 255);
                newImageData[pixel + 2] = Math.min(Math.max(b, 0), 255);
                newImageData[pixel + 3] = data[pixel + 3]; // alpha channel
            }
        }

        currentImageData.data.set(newImageData);
        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to apply Laplacian filter.");
    }
}

// Implement Roberts filter logic here
function applyRobertsFilter() {
    if (currentImageData) {
        let width = currentImageData.width;
        let height = currentImageData.height;
        let data = currentImageData.data;
        let newImageData = new Uint8ClampedArray(data.length);

        let kernelX = [
            [1, 0],
            [0, -1]
        ];

        let kernelY = [
            [0, 1],
            [-1, 0]
        ];

        let kernelSize = 2;
        let kernelHalf = Math.floor(kernelSize / 2);

        // Apply the Roberts filter
        for (let y = kernelHalf; y < height - kernelHalf; y++) {
            for (let x = kernelHalf; x < width - kernelHalf; x++) {
                let rX = 0, gX = 0, bX = 0;
                let rY = 0, gY = 0, bY = 0;

                // Apply the kernels
                for (let ky = -kernelHalf; ky < kernelSize - kernelHalf; ky++) {
                    for (let kx = -kernelHalf; kx < kernelSize - kernelHalf; kx++) {
                        let pixel = ((y + ky) * width + (x + kx)) * 4;
                        rX += data[pixel] * kernelX[ky + kernelHalf][kx + kernelHalf];
                        gX += data[pixel + 1] * kernelX[ky + kernelHalf][kx + kernelHalf];
                        bX += data[pixel + 2] * kernelX[ky + kernelHalf][kx + kernelHalf];
                        rY += data[pixel] * kernelY[ky + kernelHalf][kx + kernelHalf];
                        gY += data[pixel + 1] * kernelY[ky + kernelHalf][kx + kernelHalf];
                        bY += data[pixel + 2] * kernelY[ky + kernelHalf][kx + kernelHalf];
                    }
                }

                // Calculate the magnitude of the gradient
                let r = Math.sqrt(rX * rX + rY * rY);
                let g = Math.sqrt(gX * gX + gY * gY);
                let b = Math.sqrt(bX * bX + bY * bY);

                let pixel = (y * width + x) * 4;
                newImageData[pixel] = Math.min(Math.max(r, 0), 255);
                newImageData[pixel + 1] = Math.min(Math.max(g, 0), 255);
                newImageData[pixel + 2] = Math.min(Math.max(b, 0), 255);
                newImageData[pixel + 3] = data[pixel + 3]; // alpha channel
            }
        }

        currentImageData.data.set(newImageData);
        processedCtx.putImageData(currentImageData, 0, 0);
    } else {
        alert("No image data available to apply Roberts filter.");
    }
}
// Function to apply Gradient Filter

    function applyGradientFilter() {
        if (currentImageData) {
            let width = currentImageData.width;
            let height = currentImageData.height;
            let data = currentImageData.data;
            let newImageData = new Uint8ClampedArray(data.length);
    
            let kernels = [
                [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]],
                [[1, 1, 1], [0, 0, 0], [-1, -1, -1]]
            ];
    
            let kernelSize = kernels[0].length;
            let kernelHalf = Math.floor(kernelSize / 2);
    
            // Apply both gradient kernels
            for (let y = kernelHalf; y < height - kernelHalf; y++) {
                for (let x = kernelHalf; x < width - kernelHalf; x++) {
                    let rX = 0, gX = 0, bX = 0;
                    let rY = 0, gY = 0, bY = 0;
    
                    for (let k = 0; k < kernels.length; k++) {
                        let kernel = kernels[k];
                        for (let ky = 0; ky < kernel.length; ky++) {
                            for (let kx = 0; kx < kernel[0].length; kx++) {
                                let pixel = ((y + ky - kernelHalf) * width + (x + kx - kernelHalf)) * 4;
                                let weight = kernel[ky][kx];
                                if (k === 0) {
                                    rX += data[pixel] * weight;
                                    gX += data[pixel + 1] * weight;
                                    bX += data[pixel + 2] * weight;
                                } else {
                                    rY += data[pixel] * weight;
                                    gY += data[pixel + 1] * weight;
                                    bY += data[pixel + 2] * weight;
                                }
                            }
                        }
                    }
    
                    let r = Math.sqrt(rX * rX + rY * rY);
                    let g = Math.sqrt(gX * gX + gY * gY);
                    let b = Math.sqrt(bX * bX + bY * bY);
    
                    let pixel = (y * width + x) * 4;
                    newImageData[pixel] = Math.min(Math.max(r, 0), 255);
                    newImageData[pixel + 1] = Math.min(Math.max(g, 0), 255);
                    newImageData[pixel + 2] = Math.min(Math.max(b, 0), 255);
                    newImageData[pixel + 3] = data[pixel + 3]; // alpha channel
                }
            }
    
            currentImageData.data.set(newImageData);
            processedCtx.putImageData(currentImageData, 0, 0);
        } else {
            alert("No image data available to apply Gradient filter.");
        }
    }

