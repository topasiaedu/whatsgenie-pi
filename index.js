const express = require('express');
const { createCanvas } = require('canvas');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000; // You can choose the port you prefer

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve images from the public directory
app.use('/images', express.static(path.join(__dirname, 'public')));

// POST endpoint to generate an image
app.post('/generate-image', async (req, res) => {
  try {
    const { canvasState, uniqueID } = req.body; // canvasState should include all necessary data

    // Create a new canvas instance with the desired dimensions
    const canvas = createCanvas(canvasState.width, canvasState.height);
    const ctx = canvas.getContext('2d');

    // Here you would use the canvas API to recreate the state
    // This is a simplified example. You would need to implement your actual drawing logic.
    // ctx.fillText('Hello World', 50, 100);

    // If canvasState is compatible with node-canvas, you can directly load it
    const fabric = require('fabric').fabric;
    fabric.Canvas.prototype.loadFromJSON(canvasState, function() {
      canvas.renderAll();
    });

    // Save the canvas to an image file
    const buffer = canvas.toBuffer('image/png');

    // Path where the image will be saved
    const directoryPath = path.join(__dirname, 'public', 'personalized_image');
    const filePath = path.join(directoryPath, `${uniqueID}.png`);

    // Ensure the directory exists
    fs.mkdirSync(directoryPath, { recursive: true });

    // Save the buffer to a file
    fs.writeFileSync(filePath, buffer);

    // Respond with the URL to the image
    res.status(200).json({ imageUrl: `http://yourserver.com/images/personalized_image/${uniqueID}.png` });
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while generating the image.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Image generation service running at http://localhost:${port}`);
});
