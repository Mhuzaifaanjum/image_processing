document.getElementById('imageUpload').addEventListener('change', loadImage);
document.getElementById('resizeButton').addEventListener('click', resizeImage);
document.getElementById('generateHistogram').addEventListener('click', generateHistogram);
document.getElementById('thresholdingButton').addEventListener('click', toggleThresholdingDropdown);
document.getElementById('otsuMethodButton').addEventListener('click', applyOtsuMethod);
document.getElementById('punMethodButton').addEventListener('click', applyPunMethod);
document.getElementById('userThresholdingButton').addEventListener('click', applyUserThresholding);
document.getElementById('kapurMethodButton').addEventListener('click', applyKapurMethod);
document.getElementById('sahooMethodButton').addEventListener('click', applySahooMethod);
document.getElementById('wongMethodButton').addEventListener('click', applyWongMethod);
document.getElementById('kittlerMethodButton').addEventListener('click', applyKittlerMethod);
document.getElementById('illingworthMethodButton').addEventListener('click', applyIllingworthMethod);
document.getElementById('abutalebMethodButton').addEventListener('click', applyAbutalebMethod);
document.getElementById('traceButton').addEventListener('click', applyTrace);
document.getElementById('cannyButton').addEventListener('click', applyCanny);
document.getElementById('edgeDetectionButton').addEventListener('click', applyEdgeDetection);





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
    histogramCanvas.width = 256;
    histogramCanvas.height = 100;
    histogramCtx.clearRect(0, 0, histogramCanvas.width, histogramCanvas.height);
    
    let maxCount = Math.max(...histogramData);
    histogramCtx.fillStyle = 'black';
    
    for (let i = 0; i < histogramData.length; i++) {
        let height = (histogramData[i] / maxCount) * histogramCanvas.height;
        histogramCtx.fillRect(i, histogramCanvas.height - height, 1, height);
    }
}
// Toggle the visibility of the thresholding dropdown
function toggleThresholdingDropdown() {
    let dropdown = document.getElementById('thresholdingDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Apply Otsu's Thresholding Method
function applyOtsuMethod() {
    if (!currentImageData) {
        alert("No image data available.");
        return;
    }

    let histogram = getHistogram(currentImageData);
    let threshold = otsuThreshold(histogram);
    applyThreshold(threshold);
}

// Apply Pun's Thresholding Method
function applyPunMethod() {
    if (!currentImageData) {
        alert("No image data available.");
        return;
    }

    let histogram = getHistogram(currentImageData);
    let threshold = punThreshold(histogram);
    applyThreshold(threshold);
}

// Apply User-defined Thresholding Method
function applyUserThresholding() {
    let threshold = parseInt(prompt("Enter threshold value (0-255):"));
    if (isNaN(threshold) || threshold < 0 || threshold > 255) {
        alert("Invalid threshold value.");
        return;
    }

    applyThreshold(threshold);
}

// Function to get the histogram of the current image data
function getHistogram(imageData) {
    let histogram = new Array(256).fill(0);
    let data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let gray = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);
        histogram[gray]++;
    }

    return histogram;
}

// Function to calculate Otsu's threshold
function otsuThreshold(histogram) {
    let total = histogram.reduce((a, b) => a + b, 0);
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maximum = 0.0;
    let threshold = 0;

    for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;

        wF = total - wB;
        if (wF === 0) break;

        sumB += t * histogram[t];
        let mB = sumB / wB;
        let mF = (sum - sumB) / wF;

        let between = wB * wF * Math.pow(mB - mF, 2);
        if (between > maximum) {
            maximum = between;
            threshold = t;
        }
    }

    return threshold;
}

// Function to calculate Pun's threshold
function punThreshold(histogram) {
    let total = histogram.reduce((a, b) => a + b, 0);
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];

    let threshold = 0;
    let minVariance = Number.MAX_VALUE;

    for (let t = 0; t < 256; t++) {
        let wB = histogram.slice(0, t + 1).reduce((a, b) => a + b, 0);
        let wF = total - wB;

        if (wB === 0 || wF === 0) continue;

        let sumB = histogram.slice(0, t + 1).reduce((a, b, i) => a + i * b, 0);
        let mB = sumB / wB;
        let mF = (sum - sumB) / wF;

        let variance = wB * wF * Math.pow(mB - mF, 2);
        if (variance < minVariance) {
            minVariance = variance;
            threshold = t;
        }
    }

    return threshold;
}

// Function to apply a given threshold to the image
function applyThreshold(threshold) {
    let imageData = currentImageData;
    let data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let gray = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);
        let value = gray > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = value;
    }

    processedCtx.putImageData(imageData, 0, 0);



}


// Function to apply Kapur's Thresholding Method
function applyKapurMethod() {
    if (!currentImageData) {
        alert("No image data available.");
        return;
    }

    let histogram = getHistogram(currentImageData);
    let threshold = kapurThreshold(histogram);
    applyThreshold(threshold);
}

// Function to apply Sahoo's Thresholding Method
function applySahooMethod() {
    if (!currentImageData) {
        alert("No image data available.");
        return;
    }

    let histogram = getHistogram(currentImageData);
    let threshold = sahooThreshold(histogram);
    applyThreshold(threshold);
}

// Function to apply Wong's Thresholding Method
function applyWongMethod() {
    if (!currentImageData) {
        alert("No image data available.");
        return;
    }

    let histogram = getHistogram(currentImageData);
    let threshold = wongThreshold(histogram);
    applyThreshold(threshold);
}

// Function to apply Kittler's Thresholding Method
function applyKittlerMethod() {
    if (!currentImageData) {
        alert("No image data available.");
        return;
    }

    let histogram = getHistogram(currentImageData);
    let threshold = kittlerThreshold(histogram);
    applyThreshold(threshold);
}

// Function to apply Illingworth's Thresholding Method
function applyIllingworthMethod() {
    if (!currentImageData) {
        alert("No image data available.");
        return;
    }

    let histogram = getHistogram(currentImageData);
    let threshold = illingworthThreshold(histogram);
    applyThreshold(threshold);
}

// Function to apply Abutaleb's Thresholding Method
function applyAbutalebMethod() {
    if (!currentImageData) {
        alert("No image data available.");
        return;
    }

    let histogram = getHistogram(currentImageData);
    let threshold = abutalebThreshold(histogram);
    applyThreshold(threshold);
}

// Function to calculate Kapur's threshold
function kapurThreshold(histogram) {
    let total = histogram.reduce((a, b) => a + b, 0);
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maximum = 0.0;
    let threshold = 0;

    for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;

        wF = total - wB;
        if (wF === 0) break;

        sumB += t * histogram[t];
        let mB = sumB / wB;
        let mF = (sum - sumB) / wF;

        let pB = wB / total;
        let pF = wF / total;
        let H = pB * pF * Math.log((pB * pF) / (mB * mF));

        if (H > maximum) {
            maximum = H;
            threshold = t;
        }
    }

    return threshold;
}

// Function to calculate Sahoo's threshold
function sahooThreshold(histogram) {
    let total = histogram.reduce((a, b) => a + b, 0);
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maximum = 0.0;
    let threshold = 0;

    for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;

        wF = total - wB;
        if (wF === 0) break;

        sumB += t * histogram[t];
        let mB = sumB / wB;
        let mF = (sum - sumB) / wF;

        let variance = wB * wF * Math.pow(mB - mF, 2);
        if (variance > maximum) {
            maximum = variance;
            threshold = t;
        }
    }

    return threshold;
}

// Function to calculate Wong's threshold
function wongThreshold(histogram) {
    let total = histogram.reduce((a, b) => a + b, 0);
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maximum = 0.0;
    let threshold = 0;

    for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;

        wF = total - wB;
        if (wF === 0) break;

        sumB += t * histogram[t];
        let mB = sumB / wB;
        let mF = (sum - sumB) / wF;

        let between = wB * wF * Math.pow(mB - mF, 2);
        let within = wB * (mB * mB) + wF * (mF * mF);

        let H = between / within;
        if (H > maximum) {
            maximum = H;
            threshold = t;
        }
    }

    return threshold;
}

// Function to calculate Kittler's threshold
function kittlerThreshold(histogram) {
    let total = histogram.reduce((a, b) => a + b, 0);
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];

    let threshold = 0;
    let minError = Number.MAX_VALUE;

    for (let t = 0; t < 256; t++) {
        let wB = histogram.slice(0, t + 1).reduce((a, b) => a + b, 0);
        let wF = total - wB;

        if (wB === 0 || wF === 0) continue;

        let sumB = histogram.slice(0, t + 1).reduce((a, b, i) => a + i * b, 0);
        let mB = sumB / wB;
        let mF = (sum - sumB) / wF;

        let error = wB * Math.log(wB) + wF * Math.log(wF) - (wB * Math.log(mB) + wF * Math.log(mF));
        if (error < minError) {
            minError = error;
            threshold = t;
        }
    }

    return threshold;
}

// Function to calculate Illingworth's threshold
function illingworthThreshold(histogram) {
    let total = histogram.reduce((a, b) => a + b, 0);
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];

    let threshold = 0;
    let minError = Number.MAX_VALUE;

    for (let t = 0; t < 256; t++) {
        let wB = histogram.slice(0, t + 1).reduce((a, b) => a + b, 0);
        let wF = total - wB;

        if (wB === 0 || wF === 0) continue;

        let sumB = histogram.slice(0, t + 1).reduce((a, b, i) => a + i * b, 0);
        let mB = sumB / wB;
        let mF = (sum - sumB) / wF;

        let error = (wB * wF) / (wB + wF) * Math.pow(mB - mF, 2);
        if (error < minError) {
            minError = error;
            threshold = t;
        }
    }

    return threshold;
}

// Function to calculate Abutaleb's threshold
function abutalebThreshold(histogram) {
    let total = histogram.reduce((a, b) => a + b, 0);
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];

    let threshold = 0;
    let minError = Number.MAX_VALUE;

    for (let t = 0; t < 256; t++) {
        let wB = histogram.slice(0, t + 1).reduce((a, b) => a + b, 0);
        let wF = total - wB;

        if (wB === 0 || wF === 0) continue;

        let sumB = histogram.slice(0, t + 1).reduce((a, b, i) => a + i * b, 0);
        let mB = sumB / wB;
        let mF = (sum - sumB) / wF;

        let H = (wB * wF * Math.pow(mB - mF, 2)) / (wB * wF + (wB + wF));
        if (H < minError) {
            minError = H;
            threshold = t;
        }
    }

    return threshold;
}

// Function to apply a given threshold to the image
function applyThreshold(threshold) {
    let imageData = currentImageData;
    let data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let gray = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);
        let value = gray > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = value;
    }

    processedCtx.putImageData(imageData, 0, 0);
}

// Function to apply Trace Edge Detection
function applyTrace() {
    if (!currentImageData) {
        alert("No image data available.");
        return;
    }

    let imageData = currentImageData;
    let data = imageData.data;

    // Example Trace edge detection algorithm (simplified)
    // You can replace this with a more sophisticated algorithm if needed
    for (let i = 0; i < data.length; i += 4) {
        let gray = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);
        let edge = (gray > 128) ? 255 : 0; // Simple threshold for edge detection
        data[i] = data[i + 1] = data[i + 2] = edge;
    }

    processedCtx.putImageData(imageData, 0, 0);
}

// Function to apply Canny Edge Detection
function applyCanny() {
    if (!currentImageData) {
        alert("No image data available.");
        return;
    }

    let imageData = currentImageData;
    let grayImage = grayscale(imageData);
    let edges = cannyEdgeDetection(grayImage);

    processedCtx.putImageData(edges, 0, 0);
}

// Function to apply Edge Detection
function applyEdgeDetection() {
    if (!currentImageData) {
        alert("No image data available.");
        return;
    }

    let imageData = currentImageData;
    let grayImage = grayscale(imageData);
    let edges = edgeDetectionAlgorithm(grayImage);

    processedCtx.putImageData(edges, 0, 0);
}

// Helper function to convert image to grayscale
function grayscale(imageData) {
    let grayImage = new ImageData(imageData.width, imageData.height);
    let data = imageData.data;
    let grayData = grayImage.data;

    for (let i = 0; i < data.length; i += 4) {
        let gray = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);
        grayData[i] = grayData[i + 1] = grayData[i + 2] = gray;
        grayData[i + 3] = data[i + 3]; // Preserve alpha channel
    }

    return grayImage;
}

// Placeholder for Canny Edge Detection function
function cannyEdgeDetection(imageData) {
    // Implement Canny edge detection here
    // This is a placeholder implementation
    let data = imageData.data;
    let edges = new ImageData(imageData.width, imageData.height);
    let edgeData = edges.data;

    for (let i = 0; i < data.length; i += 4) {
        let gray = data[i];
        let edge = (gray > 128) ? 255 : 0; // Simplified edge detection
        edgeData[i] = edgeData[i + 1] = edgeData[i + 2] = edge;
        edgeData[i + 3] = data[i + 3];
    }

    return edges;
}


// Placeholder for general Edge Detection function
function edgeDetectionAlgorithm(imageData) {
    // Implement general edge detection algorithm here
    // This is a placeholder implementation
    let data = imageData.data;
    let edges = new ImageData(imageData.width, imageData.height);
    let edgeData = edges.data;

    for (let i = 0; i < data.length; i += 4) {
        let gray = data[i];
        let edge = (gray > 128) ? 255 : 0; // Simplified edge detection
        edgeData[i] = edgeData[i + 1] = edgeData[i + 2] = edge;
        edgeData[i + 3] = data[i + 3];
    }

    return edges;
}
