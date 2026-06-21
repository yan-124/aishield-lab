const fs = require('fs');
const path = require('path');

function analyzeGLB(filePath) {
  const data = fs.readFileSync(filePath);
  const jsonLength = data.readUInt32LE(12);
  const jsonData = JSON.parse(data.slice(20, 20 + jsonLength).toString());
  
  console.log('File:', path.basename(filePath));
  console.log('Total size:', (data.length / 1024 / 1024).toFixed(2), 'MB');
  
  if (jsonData.buffers) {
    jsonData.buffers.forEach((buf, i) => {
      console.log('Buffer', i + ':', (buf.byteLength / 1024 / 1024).toFixed(2), 'MB');
    });
  }
  
  if (jsonData.images) {
    console.log('Images:', jsonData.images.length);
  }
  if (jsonData.meshes) {
    console.log('Meshes:', jsonData.meshes.length);
  }
  console.log('---');
}

analyzeGLB('dist3/shieldy-3d/shieldy-b.glb');
analyzeGLB('dist3/shieldy-3d/shieldy-d.glb');
