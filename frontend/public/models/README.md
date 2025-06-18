# 3D Models Directory

This directory is ready for your custom mechanical assembly 3D model.

## Supported Formats
- .glb (preferred - optimized binary format)
- .gltf (with associated textures and materials)

## Instructions for Your Custom Model

1. **Export from Blender:**
   - Select your mechanical assembly
   - File → Export → glTF 2.0
   - Choose "glTF Binary (.glb)" format
   - Enable "Apply Modifiers"
   - Enable "Export Materials"

2. **Upload:**
   - Place your model file in this directory
   - Name it: `mechanical-assembly.glb`
   - The app will automatically load it

3. **Model Requirements:**
   - Recommended size: 2-4 units in Blender units
   - Center the model at origin (0,0,0)
   - Use reasonable polygon count (< 50k vertices for web performance)

## Current Status
- ✅ Code ready to load custom model
- ⏳ Waiting for your Blender export
- ✅ Fallback placeholder active

When you upload your model, update the path in App.js:
`modelPath="/models/mechanical-assembly.glb"`