const express = require('express');
const { fabric } = require('fabric');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Use body-parser to parse JSON and urlencoded request bodies
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static images from the 'public' directory
app.use('/images', express.static(path.join(__dirname, 'public')));


// Assuming you have a font file named 'YourChineseFont.ttf' in the 'fonts' directory
fabric.nodeCanvas.registerFont(__dirname + '/fonts/arial-unicode-ms.ttf', { family: 'Arial Unicode MS' });

// Function to check if a string contains Chinese characters
function containsChinese(text) {
  return /[\u3400-\u9FBF]/.test(text);
}

// POST endpoint to generate an image based on canvas state
app.post('/generate-image', async (req, res) => {
  try {
    // Destructure the canvas state and unique ID from the request body
    const { canvasState, uniqueID } = req.body;

    // Validate the incoming canvas state
    if (!canvasState || !uniqueID) {
      throw new Error('Canvas state or unique ID is missing in the request.');
    }

    // Dynamically set canvas dimensions based on the request
    const width = canvasState.width || 889; // Default to 889 if width is not provided
    const height = canvasState.height || 500; // Default to 500 if height is not provided

    // Create a new Fabric canvas with dynamic dimensions
    const canvas = new fabric.StaticCanvas(null, { width, height, backgroundColor: 'white' });
    
    canvasState.objects.forEach((obj) => {
      if (obj.type === 'textbox' && containsChinese(obj.text)) {
        obj.fontFamily = 'Arial Unicode MS'; // Example: SimSun is a font that supports Chinese characters
      }
    });
    // Load the canvas state into the Fabric canvas
    canvas.loadFromJSON(canvasState, async () => {
      // Update text objects to use a different font if they contain Chinese characters
      canvas.forEachObject((obj) => {
        if (obj.type === 'text' && containsChinese(obj.text)) {
          console.log(obj.text)
          obj.set('fontFamily', 'SimSun'); // Example: SimSun is a font that supports Chinese characters
        }
      });

      // Ensure the canvas background is white
      canvas.setBackgroundColor('white', canvas.renderAll.bind(canvas));

      // Convert the Fabric canvas to a PNG data URL
      const dataUrl = canvas.toDataURL({ format: 'png', quality: 1 });

      // Extract the base64 part of the data URL and convert it to a buffer
      const base64Data = dataUrl.split(';base64,').pop();
      const buffer = Buffer.from(base64Data, 'base64');

      // Define the directory and file path for the image
      const directoryPath = path.join(__dirname, 'public', 'personalized_image');
      const filePath = path.join(directoryPath, `${uniqueID}.png`);

      // Create the directory if it doesn't exist and write the image file
      await fs.mkdir(directoryPath, { recursive: true });
      await fs.writeFile(filePath, buffer);

      // Respond with the URL to the generated image
      res.status(200).json({ imageUrl: `https://whatsgenie-pi.onrender.com/images/personalized_image/${uniqueID}.png` });
    });

  } catch (err) {
    // Log the error and respond with a server error status
    console.error('Error generating image:', err);
    res.status(500).send('An error occurred while generating the image.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Image generation service running at http://localhost:${port}`);
});
